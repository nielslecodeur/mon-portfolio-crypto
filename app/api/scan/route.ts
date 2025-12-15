import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chainId = searchParams.get('chain');

  if (!address || !chainId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // Conversion Chain ID pour Moralis (Hexadécimal)
  const chainHex = `0x${Number(chainId).toString(16)}`;
  const apiKey = process.env.MORALIS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Server Config Error: No API Key' }, { status: 500 });
  }

  try {
    // On demande à Moralis : "Donne-moi tous les tokens de ce wallet"
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${chainHex}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': apiKey,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}