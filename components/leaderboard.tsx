"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

// Player type definition
type Player = {
  _id?: string
  id?: string
  name: string
  balance: number
  wins: number
  losses: number
}

// Para rastrear qué valores han cambiado
type ChangedValues = {
  [key: string]: {
    balance?: boolean;
    wins?: boolean;
    losses?: boolean;
    position?: number;
  }
}

export function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const prevPlayersRef = useRef<Player[]>([])
  const [changedValues, setChangedValues] = useState<ChangedValues>({})
  
  // Comparar cambios en los datos y marcar qué ha cambiado
  const detectChanges = (newPlayers: Player[], oldPlayers: Player[]) => {
    const changes: ChangedValues = {};
    
    newPlayers.forEach((player, index) => {
      const playerId = player._id || player.id || `player-${index}`;
      const oldPlayerIndex = oldPlayers.findIndex(p => (p._id || p.id) === playerId);
      
      if (oldPlayerIndex === -1) {
        // Nuevo jugador
        changes[playerId] = { balance: true, wins: true, losses: true };
        return;
      }
      
      const oldPlayer = oldPlayers[oldPlayerIndex];
      changes[playerId] = {};
      
      // Verificar cambios en valores específicos
      if (player.balance !== oldPlayer.balance) {
        changes[playerId].balance = true;
      }
      
      if (player.wins !== oldPlayer.wins) {
        changes[playerId].wins = true;
      }
      
      if (player.losses !== oldPlayer.losses) {
        changes[playerId].losses = true;
      }
      
      // Verificar cambio de posición
      if (oldPlayerIndex !== index) {
        changes[playerId].position = oldPlayerIndex - index;
      }
    });
    
    return changes;
  };

  // Function to fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/leaderboard")
      if (response.ok) {
        const data = await response.json()
        
        // Detectar cambios antes de actualizar el estado
        const changes = detectChanges(data, players);
        setChangedValues(changes);
        
        // Guardar estado previo y actualizar jugadores
        prevPlayersRef.current = [...players]
        setPlayers(data)
        setLastUpdated(new Date())
        
        // Limpiar los cambios después de 2 segundos
        setTimeout(() => {
          setChangedValues({});
        }, 2000);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchLeaderboard()

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchLeaderboard, 30000)

    // Clean up interval on unmount
    return () => clearInterval(interval)
  }, [])

  // Determinar si un valor específico ha cambiado
  const hasChanged = (playerId: string | undefined, field: 'balance' | 'wins' | 'losses') => {
    if (!playerId) return false;
    const id = playerId || '';
    return changedValues[id] && changedValues[id][field];
  };

  // Obtener el cambio de posición
  const getPositionChange = (playerId: string | undefined) => {
    if (!playerId) return 0;
    const id = playerId || '';
    return changedValues[id]?.position || 0;
  }

  return (
    <Card className="h-full bg-white">
      <CardHeader className="bg-[#204d34] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={20} />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-[#e0fbe0]">Player balances</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="text-white hover:bg-[#18392b]"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {lastUpdated && (
          <div className="px-4 py-2 text-xs text-[#18392b] border-b bg-[#e0fbe0]">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full">
            <thead className="bg-[#e0fbe0] sticky top-0">
              <tr>
                <th className="text-left p-3 text-[#18392b]">Rank</th>
                <th className="text-left p-3 text-[#18392b]">Player</th>
                <th className="text-right p-3 text-[#18392b]">W/L</th>
                <th className="text-right p-3 text-[#18392b]">Balance</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {players.length > 0 ? (
                  players.map((player, index) => {
                    const playerId = player._id || player.id;
                    const positionChange = getPositionChange(playerId);
                    const balanceChanged = hasChanged(playerId, 'balance');
                    const winsChanged = hasChanged(playerId, 'wins');
                    const lossesChanged = hasChanged(playerId, 'losses');
                    
                    return (
                      <motion.tr 
                        key={playerId || index} 
                        className={index % 2 === 0 ? "bg-white" : "bg-[#f8faf7]"}
                        initial={{ opacity: !prevPlayersRef.current.some(p => (p._id || p.id) === playerId) ? 0 : 1, y: 0 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: { type: "spring", stiffness: 300, damping: 20 }
                        }}
                        exit={{ opacity: 0 }}
                        style={{
                          zIndex: players.length - index,
                          position: "relative"
                        }}
                      >
                        <td className="p-3 text-[#18392b]">
                          {positionChange > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="absolute left-1 text-green-600 text-xs font-bold"
                            >
                              ↑
                            </motion.div>
                          )}
                          {positionChange < 0 && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="absolute left-1 text-red-600 text-xs font-bold"
                            >
                              ↓
                            </motion.div>
                          )}
                          {index === 0 ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-white">1</div>
                          ) : index === 1 ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-white">2</div>
                          ) : index === 2 ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white">3</div>
                          ) : (
                            <div className="pl-2">{index + 1}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-[#18392b]">{player.name}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block">
                            {(winsChanged || lossesChanged) && (
                              <motion.div 
                                className="absolute inset-0 rounded-md bg-[#acf2bd]"
                                initial={{ opacity: 0.7 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 1.5 }}
                              />
                            )}
                            <span className="font-semibold text-[#204d34] relative z-10">
                              <motion.span
                                animate={winsChanged ? { 
                                  scale: [1, 1.3, 1],
                                  color: ['#204d34', '#14803a', '#204d34'] 
                                } : {}}
                                transition={{ duration: 0.5 }}
                              >
                                {player.wins}
                              </motion.span>
                              /
                              <motion.span
                                animate={lossesChanged ? { 
                                  scale: [1, 1.3, 1],
                                  color: ['#204d34', '#dc2626', '#204d34'] 
                                } : {}}
                                transition={{ duration: 0.5 }}
                              >
                                {player.losses}
                              </motion.span>
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block">
                            {balanceChanged && (
                              <motion.div 
                                className="absolute inset-0 rounded-md bg-[#acf2bd]"
                                initial={{ opacity: 0.7 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 1.5 }}
                              />
                            )}
                            <motion.span 
                              className="font-semibold text-[#204d34] relative z-10"
                              animate={balanceChanged ? { 
                                scale: [1, 1.3, 1],
                                color: ['#204d34', '#14803a', '#204d34'] 
                              } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              ${player.balance} USDT
                            </motion.span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-[#18392b]">
                      No players yet.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
