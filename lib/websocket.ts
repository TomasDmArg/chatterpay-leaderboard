"use client"

import { useEffect, useState } from "react"

type WebSocketMessage = {
  type: string
  data: any
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  useEffect(() => {
    // Create WebSocket connection
    const ws = new WebSocket(url)

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onclose = () => {
      setIsConnected(false)

      // Try to reconnect after 3 seconds
      setTimeout(() => {
        setSocket(new WebSocket(url))
      }, 3000)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setLastMessage(message)
      } catch (error) {
        console.error("WebSocket message parse error:", error)
      }
    }

    setSocket(ws)

    // Clean up on unmount
    return () => {
      ws.close()
    }
  }, [url])

  // Function to send messages
  const sendMessage = (type: string, data: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type, data }))
    }
  }

  return { isConnected, lastMessage, sendMessage }
}

// Fallback polling function if WebSockets are not available
export function usePolling<T>(fetchFn: () => Promise<T>, interval = 5000) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const poll = async () => {
      try {
        setIsLoading(true)
        const result = await fetchFn()
        if (mounted) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Initial fetch
    poll()

    // Set up polling interval
    const intervalId = setInterval(poll, interval)

    // Clean up
    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [fetchFn, interval])

  return { data, isLoading, error }
}
