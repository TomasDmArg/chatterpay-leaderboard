import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Dice1Icon as Dice, DollarSign, Trophy, Users } from "lucide-react"

export function RulesSection() {
  return (
    <Card>
      <CardHeader className="bg-[#17442e] text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={20} />
          Game Rules
        </CardTitle>
        <CardDescription className="text-[#b6f5c1]">How to play "Double or Nothing"</CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        <Tabs defaultValue="rules">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#e6f9ed] rounded-lg p-1">
            <TabsTrigger value="rules" className="data-[state=active]:bg-[#17442e] data-[state=active]:text-white text-[#17442e] font-semibold rounded-md transition-colors">Basic Rules</TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-[#17442e] data-[state=active]:text-white text-[#17442e] font-semibold rounded-md transition-colors">Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-[#e6f9ed] p-3 rounded-full h-12 w-12 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#17442e]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#17442e]">Participants</h3>
                  <p className="text-[#18392b] font-medium">
                    All participants receive $10 USDT in their ChatterPay wallet to start the game.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-[#e6f9ed] p-3 rounded-full h-12 w-12 flex items-center justify-center">
                  <Dice className="h-6 w-6 text-[#17442e]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#17442e]">Game Mechanics</h3>
                  <p className="text-[#18392b] font-medium">Players roll a dice against a partner. Highest number wins.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-[#e6f9ed] p-3 rounded-full h-12 w-12 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#17442e]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#17442e]">Stakes</h3>
                  <p className="text-[#18392b] font-medium">If you lose, you must send $2 USDT to the winner through ChatterPay.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 bg-[#e6f9ed] p-3 rounded-full h-12 w-12 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-[#17442e]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#17442e]">Leaderboard</h3>
                  <p className="text-[#18392b] font-medium">The leaderboard shows real-time balances of all participants.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <div className="space-y-6">
              <div className="bg-[#f4fdf7] p-4 rounded-lg border border-[#b6f5c1]">
                <h3 className="font-bold text-lg text-[#17442e] mb-2">Rewards</h3>
                <p className="mb-4 text-[#18392b] font-medium">At the end of the game, your reward is your final balance: you either double your starting balance, or end with nothing!</p>
                <ul className="list-disc pl-5 space-y-2 text-[#18392b] font-medium">
                  <li>If you complete the game and make at least 5 transactions, you receive a special prize: <span className="font-bold">an Argentinian Alfajor!</span></li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
