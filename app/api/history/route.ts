// src/app/api/history/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chainId = searchParams.get('chain');

  if (!address || !chainId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const chainHex = `0x${Number(chainId).toString(16)}`;
  const apiKey = process.env.MORALIS_API_KEY;

  try {
    // On demande les transactions natives (ETH, BNB...)
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/${address}?chain=${chainHex}&limit=10&order=DESC`,
      { headers: { 'Accept': 'application/json', 'X-API-Key': apiKey || '' } }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'History fetch failed' }, { status: 500 });
  }
}