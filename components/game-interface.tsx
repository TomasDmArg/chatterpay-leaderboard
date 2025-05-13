"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RefreshCw, Send } from "lucide-react"
import { useSocket } from "@/lib/socket-client"

const DiceIcon = ({ value }: { value: number }) => {
  switch (value) {
    case 1:
      return <Dice1 className="h-12 w-12" />
    case 2:
      return <Dice2 className="h-12 w-12" />
    case 3:
      return <Dice3 className="h-12 w-12" />
    case 4:
      return <Dice4 className="h-12 w-12" />
    case 5:
      return <Dice5 className="h-12 w-12" />
    case 6:
      return <Dice6 className="h-12 w-12" />
    default:
      return <Dice1 className="h-12 w-12" />
  }
}

export function GameInterface() {
  const { sendGameResult, lastGame } = useSocket()
  const [playerDice, setPlayerDice] = useState(1)
  const [opponentDice, setOpponentDice] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [gameResult, setGameResult] = useState<"win" | "lose" | "draw" | null>(null)
  const [gameHistory, setGameHistory] = useState<
    Array<{
      id: number
      opponent: string
      playerRoll: number
      opponentRoll: number
      result: "win" | "lose" | "draw"
      amount: number
      timestamp: Date
    }>
  >([])

  // Update game history when a new game is received
  useEffect(() => {
    if (lastGame) {
      // Add to game history if it's the current player's game
      if (lastGame.playerId === "current-user-id") {
        // Replace with actual user ID
        setGameHistory((prev) => [
          {
            id: Date.now(),
            opponent: lastGame.opponentName || "Opponent",
            playerRoll: lastGame.playerRoll,
            opponentRoll: lastGame.opponentRoll,
            result: lastGame.result,
            amount: lastGame.amount,
            timestamp: new Date(lastGame.timestamp),
          },
          ...prev,
        ])
      }
    }
  }, [lastGame])

  const rollDice = () => {
    setIsRolling(true)
    setGameResult(null)

    // Animate dice rolling
    const rollInterval = setInterval(() => {
      setPlayerDice(Math.floor(Math.random() * 6) + 1)
      setOpponentDice(Math.floor(Math.random() * 6) + 1)
    }, 100)

    // Stop rolling after 2 seconds and determine winner
    setTimeout(() => {
      clearInterval(rollInterval)

      const finalPlayerRoll = Math.floor(Math.random() * 6) + 1
      const finalOpponentRoll = Math.floor(Math.random() * 6) + 1

      setPlayerDice(finalPlayerRoll)
      setOpponentDice(finalOpponentRoll)

      let result: "win" | "lose" | "draw"

      if (finalPlayerRoll > finalOpponentRoll) {
        result = "win"
      } else if (finalPlayerRoll < finalOpponentRoll) {
        result = "lose"
      } else {
        result = "draw"
      }

      setGameResult(result)
      setIsRolling(false)

      // Add to game history
      const gameData = {
        id: Date.now(),
        opponent: "Maria Garcia",
        playerRoll: finalPlayerRoll,
        opponentRoll: finalOpponentRoll,
        result,
        amount: result === "win" ? 2 : result === "lose" ? -2 : 0,
        timestamp: new Date(),
      }

      setGameHistory((prev) => [gameData, ...prev])

      // Send game result to server
      sendGameResult({
        playerId: "current-user-id", // Replace with actual user ID
        opponentId: "opponent-id", // Replace with actual opponent ID
        playerRoll: finalPlayerRoll,
        opponentRoll: finalOpponentRoll,
        result,
        amount: 2, // Fixed amount for this game
      })
    }, 2000)
  }

  return (
    <Card className="h-full">
      <CardHeader className="bg-[#204d34] text-white rounded-t-lg">
        <CardTitle>Double or Nothing</CardTitle>
        <CardDescription className="text-[#deecdc]">Roll the dice and test your luck!</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="play">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="play">Play Game</TabsTrigger>
            <TabsTrigger value="history">Game History</TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                  <AvatarFallback className="bg-[#204d34] text-white">JD</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-medium">You</h3>
                <div className="bg-[#deecdc] p-6 rounded-lg">
                  <DiceIcon value={playerDice} />
                </div>
                <Badge className="bg-[#204d34]">$18 USDT</Badge>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                  <AvatarFallback className="bg-[#204d34] text-white">MG</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-medium">Maria Garcia</h3>
                <div className="bg-[#deecdc] p-6 rounded-lg">
                  <DiceIcon value={opponentDice} />
                </div>
                <Badge className="bg-[#204d34]">$18 USDT</Badge>
              </div>
            </div>

            {gameResult && (
              <div
                className={`p-4 rounded-lg text-center ${
                  gameResult === "win"
                    ? "bg-green-100 text-green-800"
                    : gameResult === "lose"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {gameResult === "win" ? (
                  <p className="font-medium">You won! +$2 USDT</p>
                ) : gameResult === "lose" ? (
                  <p className="font-medium">You lost! -$2 USDT</p>
                ) : (
                  <p className="font-medium">It's a draw! No USDT exchanged</p>
                )}
              </div>
            )}

            <div className="flex justify-center gap-4">
              <Button onClick={rollDice} disabled={isRolling} className="bg-[#204d34] hover:bg-[#0d352c]">
                {isRolling ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Rolling...
                  </>
                ) : (
                  <>Roll Dice</>
                )}
              </Button>

              {gameResult === "lose" && (
                <Button variant="outline" className="border-[#204d34] text-[#204d34]">
                  <Send className="mr-2 h-4 w-4" />
                  Send $2 USDT
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4 max-h-[400px] overflow-auto">
              {gameHistory.length > 0 ? (
                gameHistory.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#204d34] text-white">{game.opponent.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{game.opponent}</p>
                        <p className="text-sm text-gray-500">
                          {game.timestamp.toLocaleTimeString()} • {game.playerRoll} vs {game.opponentRoll}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        game.result === "win" ? "bg-green-600" : game.result === "lose" ? "bg-red-600" : "bg-yellow-600"
                      }
                    >
                      {game.amount > 0 ? `+$${game.amount}` : game.amount < 0 ? `-$${Math.abs(game.amount)}` : "$0"}{" "}
                      USDT
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No games played yet. Start rolling!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
