import { lookup } from 'node:dns/promises';
import net from 'node:net';
import type { PoolConfig } from 'pg';

const PROBE_TIMEOUT_MS = 2000;

function probePort(host: string, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Timeout probing ${host}:${port}`));
    }, PROBE_TIMEOUT_MS);

    socket.once('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(port);
    });
    socket.once('error', (error) => {
      clearTimeout(timer);
      socket.destroy();
      reject(error);
    });
  });
}

async function findReachableAddress(host: string, port: number): Promise<string> {
  const addresses = await lookup(host, { family: 4, all: true });
  if (addresses.length === 0) {
    throw new Error(`No IPv4 address found for ${host}`);
  }

  const settled = await Promise.allSettled(
    addresses.map(({ address }) => probePort(address, port)),
  );
  const index = settled.findIndex((result) => result.status === 'fulfilled');
  if (index === -1) {
    throw new Error(`No reachable address found for ${host}:${port}`);
  }
  return addresses[index]!.address;
}

export async function buildReachablePgConfig(connectionString: string): Promise<PoolConfig> {
  const url = new URL(connectionString);
  const host = url.hostname;
  const port = Number(url.port) || 5432;
  const address = await findReachableAddress(host, port);

  const sslMode = url.searchParams.get('sslmode');
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  return {
    host: address,
    port,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl:
      sslMode !== 'disable' && (sslMode !== null || !isLocalHost)
        ? { servername: host }
        : undefined,
    connectionTimeoutMillis: 15000,
  };
}
