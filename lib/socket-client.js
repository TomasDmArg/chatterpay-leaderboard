"use client"

import { useEffect, useState, useCallback } from "react"
import io from "socket.io-client"

let socket

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [lastGame, setLastGame] = useState(null)

  useEffect(() => {
    // Initialize socket connection
    const initSocket = async () => {
      // Make sure socket server is running
      await fetch("/api/socket")

      // Connect to socket server
      if (!socket) {
        socket = io()

        socket.on("connect", () => {
          console.log("Socket connected")
          setIsConnected(true)
        })

        socket.on("disconnect", () => {
          console.log("Socket disconnected")
          setIsConnected(false)
        })

        socket.on("leaderboard", (data) => {
          setLeaderboard(data)
        })

        socket.on("game-update", (data) => {
          setLastGame(data)
        })
      }
    }

    initSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  // Function to send game results
  const sendGameResult = useCallback(
    (gameData) => {
      if (socket && isConnected) {
        socket.emit("game-result", gameData)
      } else {
        console.warn("Socket not connected, cannot send game result")
      }
    },
    [isConnected],
  )

  return {
    isConnected,
    leaderboard,
    lastGame,
    sendGameResult,
  }
}
