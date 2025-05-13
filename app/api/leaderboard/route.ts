import { NextResponse, NextRequest } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { withAdminAuth } from "@/lib/auth"

// Utility helper to serialise MongoDB documents so that the `_id` field is always
// a string.  This avoids React side comparisons between two different ObjectId
// instances (which would always fail due to referential inequality) and also
// makes the data JSON-serialisable without special `$oid` wrappers.
function normalisePlayers<T extends { _id?: any }>(players: T[]): (Omit<T, '_id'> & { _id?: string })[] {
  return players.map((player) => {
    const normalised: any = { ...player }
    if (player._id) {
      try {
        // Handle both raw ObjectId instances as well as the { $oid: string } shape
        normalised._id = typeof player._id === 'object' && '$oid' in player._id
          ? player._id.$oid
          : player._id.toString();
      } catch {
        normalised._id = String(player._id)
      }
    }
    return normalised
  })
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("chatterpay-leaderboard")
    const players = await db.collection("players").find({}).sort({ balance: -1 }).toArray()
    return NextResponse.json(normalisePlayers(players))
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard data" }, { status: 500 })
  }
}

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { playerId, newBalance } = await request.json()
    if (!playerId || newBalance === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db("chatterpay-leaderboard")
    await db.collection("players").updateOne(
      { _id: new ObjectId(playerId) },
      { $set: { balance: newBalance } }
    )
    const players = await db.collection("players").find({}).sort({ balance: -1 }).toArray()
    return NextResponse.json(normalisePlayers(players))
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update player data" }, { status: 500 })
  }
})

export const PUT = withAdminAuth(async (request: NextRequest) => {
  try {
    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: "Missing player name" }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db("chatterpay-leaderboard")
    await db.collection("players").insertOne({ name, balance: 10, wins: 0, losses: 0 })
    const players = await db.collection("players").find({}).sort({ balance: -1 }).toArray()
    return NextResponse.json(normalisePlayers(players))
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
  }
})

export const PATCH = withAdminAuth(async (request: NextRequest) => {
  try {
    const { playerId, type, delta } = await request.json()
    if (!playerId || !type || typeof delta !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (!['win', 'loss'].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db("chatterpay-leaderboard")
    await db.collection("players").updateOne(
      { _id: new ObjectId(playerId) },
      { $inc: { [type === 'win' ? 'wins' : 'losses']: delta } }
    )
    const players = await db.collection("players").find({}).sort({ balance: -1 }).toArray()
    return NextResponse.json(normalisePlayers(players))
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to update wins/losses" }, { status: 500 })
  }
})

export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing player id" }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db("chatterpay-leaderboard")
    await db.collection("players").deleteOne({ _id: new ObjectId(id) })
    const players = await db.collection("players").find({}).sort({ balance: -1 }).toArray()
    return NextResponse.json(normalisePlayers(players))
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete player" }, { status: 500 })
  }
})
