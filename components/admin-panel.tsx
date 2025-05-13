"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Trash2, Plus, Minus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Player = {
  _id: string;
  name: string;
  balance: number;
  wins: number;
  losses: number;
};

// Para generar IDs temporales consistentes y evitar problemas de hidratación
let tempIdCounter = 0;
const generateTempId = (prefix = 'temp-player') => {
  return `${prefix}-${tempIdCounter++}`;
};

export function AdminPanel() {
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [balanceChange, setBalanceChange] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  
  // Individual loading states
  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false)
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false)
  const [updatingPlayerIds, setUpdatingPlayerIds] = useState<Record<string, boolean>>({})
  const [deletingPlayerIds, setDeletingPlayerIds] = useState<Record<string, boolean>>({})

  // Fetch players on component mount
  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const res = await fetch(`/api/leaderboard`)
      const data = await res.json()
      setPlayers(data)
    } catch (err) {
      console.error("Error fetching players:", err)
      toast({
        title: "Error fetching players",
        description: "Could not load player data",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBalance = async () => {
    if (!selectedPlayer || !balanceChange) {
      toast({
        title: "Missing information",
        description: "Please select a player and enter a balance change",
        variant: "destructive",
      })
      return
    }

    // Find player and calculate new balance
    const player = players.find((p) => p._id === selectedPlayer)
    if (!player) {
      toast({ title: "Error", description: "Player not found", variant: "destructive" })
      return
    }

    const change = Number.parseFloat(balanceChange)
    const newBalance = player.balance + change
    
    // Save old players state for reverting if needed
    const oldPlayers = [...players]
    
    // Optimistically update UI
    setPlayers(players.map(p => 
      p._id === selectedPlayer ? { ...p, balance: newBalance } : p
    ))
    
    // Clear form fields
    const playerName = player.name
    setSelectedPlayer("")
    setBalanceChange("")
    
    // Make API call in background
    setIsBalanceUpdating(true)
    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: selectedPlayer,
          newBalance,
        }),
      })
      
      if (response.ok) {
        toast({ title: "Success", description: `${playerName}'s balance updated to $${newBalance} USDT` })
      } else {
        // Revert on error
        setPlayers(oldPlayers)
        toast({ title: "Error", description: "Failed to update balance", variant: "destructive" })
      }
    } catch (error) {
      // Revert on error
      setPlayers(oldPlayers)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsBalanceUpdating(false)
    }
  }

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return
    
    // Generate temporary ID for new player (que sea consistente)
    const tempId = generateTempId();
    const newPlayer = {
      _id: tempId,
      name: newPlayerName,
      balance: 0,
      wins: 0,
      losses: 0
    }
    
    // Optimistically update UI
    setPlayers([...players, newPlayer])
    setNewPlayerName("")
    
    // Track player creation state
    setIsCreatingPlayer(true)
    try {
      const response = await fetch("/api/leaderboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayerName }),
      })
      
      if (response.ok) {
        // Replace temp player with real one from server
        const result = await response.json()
        setPlayers(prev => {
          // Encontrar el jugador real en los resultados
          const realPlayer = Array.isArray(result) 
            ? result.find((r: Player) => r.name === newPlayerName)
            : null;
            
          // Si no encontramos el jugador real, mantenemos el arreglo anterior
          if (!realPlayer) return prev;
          
          // Reemplazar el jugador temporal con el real
          return prev.map(p => p._id === tempId ? realPlayer : p);
        })
        toast({ title: "Success", description: `Player "${newPlayerName}" created successfully` })
      } else {
        // Remove temp player on error
        setPlayers(prev => prev.filter(p => p._id !== tempId))
        toast({ title: "Error", description: "Failed to create player", variant: "destructive" })
      }
    } catch (error) {
      // Remove temp player on error
      setPlayers(prev => prev.filter(p => p._id !== tempId))
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setIsCreatingPlayer(false)
    }
  }

  const handleDeletePlayer = async (id: string) => {
    // Save player and state for potential reversal
    const playerToDelete = players.find(p => p._id === id)
    const oldPlayers = [...players]
    
    // Optimistically update UI
    setPlayers(players.filter(p => p._id !== id))
    
    // Mark this player as being deleted
    setDeletingPlayerIds(prev => ({ ...prev, [id]: true }))
    
    try {
      const response = await fetch(`/api/leaderboard?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Success", description: "Player deleted successfully" })
      } else {
        // Revert on error
        setPlayers(oldPlayers)
        toast({ title: "Error", description: "Failed to delete player", variant: "destructive" })
      }
    } catch (error) {
      // Revert on error
      setPlayers(oldPlayers)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setDeletingPlayerIds(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    }
  }

  const handleUpdateWL = async (id: string, type: "win" | "loss", delta: number) => {
    const player = players.find(p => p._id === id)
    if (!player) return
    
    // Check if operation is valid
    if (delta < 0) {
      if ((type === "win" && player.wins <= 0) || (type === "loss" && player.losses <= 0)) {
        return
      }
    }
    
    // Save old state for potential reversal
    const oldPlayers = [...players]
    
    // Optimistically update UI
    setPlayers(players.map(p => {
      if (p._id !== id) return p
      return {
        ...p,
        wins: type === "win" ? Math.max(0, p.wins + delta) : p.wins,
        losses: type === "loss" ? Math.max(0, p.losses + delta) : p.losses
      }
    }))
    
    // Set this specific player in updating state
    const operationKey = `${id}-${type}-${delta}`
    setUpdatingPlayerIds(prev => ({ ...prev, [operationKey]: true }))
    
    try {
      const response = await fetch("/api/leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id, type, delta }),
      })
      
      if (response.ok) {
        toast({ 
          title: "Success", 
          description: `Player ${type === 'win' ? 'win' : 'loss'} ${delta > 0 ? 'increased' : 'decreased'}`
        })
      } else {
        // Revert on error
        setPlayers(oldPlayers)
        toast({ title: "Error", description: `Failed to update ${type}s`, variant: "destructive" })
      }
    } catch (error) {
      // Revert on error
      setPlayers(oldPlayers)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setUpdatingPlayerIds(prev => {
        const updated = { ...prev }
        delete updated[operationKey]
        return updated
      })
    }
  }

  // Helper to check if a specific W/L operation is in progress
  const isWLUpdating = (id: string, type: string, delta: number) => {
    const operationKey = `${id}-${type}-${delta}`
    return !!updatingPlayerIds[operationKey]
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#204d34] text-white p-4 rounded-t-lg">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-[#e0fbe0] text-sm">Manage player balances and stats</p>
      </div>

      <div className="space-y-8 px-4">
        {/* Adjust Player Balance Section */}
        <section>
          <h2 className="text-[#204d34] font-bold text-lg mb-4">Adjust Player Balance</h2>
          
          <div className="max-w-3xl">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="player" className="text-[#204d34] mb-2 block">Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer} disabled={isBalanceUpdating}>
                  <SelectTrigger id="player" className="bg-white text-[#204d34]">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player._id} value={player._id}>
                        {player.name} (${player.balance} USDT)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 max-w-xs">
                <Label htmlFor="balance-change" className="text-[#204d34] mb-2 block">Balance Change</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="balance-change" 
                    type="number" 
                    placeholder="+2 or -2" 
                    value={balanceChange} 
                    onChange={(e) => setBalanceChange(e.target.value)}
                    className="bg-white text-[#204d34]"
                    disabled={isBalanceUpdating}
                  />
                  <span className="text-[#204d34] whitespace-nowrap">USDT</span>
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleUpdateBalance} 
                disabled={isBalanceUpdating || !selectedPlayer || !balanceChange} 
                className="bg-[#204d34] hover:bg-[#163a26] text-white h-10"
              >
                {isBalanceUpdating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
                ) : (
                  "Update Balance"
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Create New Player Section */}
        <section>
          <h2 className="text-[#204d34] font-bold text-lg mb-4">Create New Player</h2>
          
          <div className="flex gap-4 max-w-md">
            <Input 
              placeholder="Enter new player name" 
              value={newPlayerName} 
              onChange={e => setNewPlayerName(e.target.value)}
              className="bg-white text-[#204d34] flex-1"
              disabled={isCreatingPlayer}
            />
            <Button 
              onClick={handleCreatePlayer} 
              disabled={isCreatingPlayer || !newPlayerName.trim()} 
              className="bg-[#204d34] hover:bg-[#163a26] text-white whitespace-nowrap"
            >
              {isCreatingPlayer ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
              ) : (
                "Add Player"
              )}
            </Button>
          </div>
        </section>

        {/* Manage Players Section */}
        <section>
          <h2 className="text-[#204d34] font-bold text-lg mb-4">Manage Players</h2>
          
          {players.length === 0 ? (
            <div className="text-center p-6 bg-white rounded-lg">
              <p className="text-[#204d34]">No players available. Create a player to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {players.map((player) => (
                <div 
                  key={player._id} 
                  className="bg-white rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <h3 className="text-[#204d34] font-semibold text-lg">{player.name}</h3>
                      <div className="bg-[#204d34] text-white px-4 py-1 rounded-md">
                        ${player.balance} USDT
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 items-center">
                      <div className="flex items-center">
                        <span className="text-[#204d34] mr-3">Wins: {player.wins}</span>
                        <div className="flex gap-1">
                          <Button 
                            onClick={() => handleUpdateWL(player._id, "win", 1)}
                            disabled={isWLUpdating(player._id, "win", 1)}
                            className="h-8 w-8 p-0 rounded-md border border-[#204d34] bg-[#e0fbe0] text-[#204d34] hover:bg-[#c1e8b8]"
                          >
                            {isWLUpdating(player._id, "win", 1) ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Plus size={16} />
                            }
                          </Button>
                          <Button 
                            onClick={() => handleUpdateWL(player._id, "win", -1)}
                            disabled={isWLUpdating(player._id, "win", -1) || player.wins === 0}
                            className="h-8 w-8 p-0 rounded-md border border-[#204d34] bg-[#e0fbe0] text-[#204d34] hover:bg-[#c1e8b8]"
                          >
                            {isWLUpdating(player._id, "win", -1) ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Minus size={16} />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-[#204d34] mr-3">Losses: {player.losses}</span>
                        <div className="flex gap-1">
                          <Button 
                            onClick={() => handleUpdateWL(player._id, "loss", 1)}
                            disabled={isWLUpdating(player._id, "loss", 1)}
                            className="h-8 w-8 p-0 rounded-md border border-[#204d34] bg-[#e0fbe0] text-[#204d34] hover:bg-[#c1e8b8]"
                          >
                            {isWLUpdating(player._id, "loss", 1) ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Plus size={16} />
                            }
                          </Button>
                          <Button 
                            onClick={() => handleUpdateWL(player._id, "loss", -1)}
                            disabled={isWLUpdating(player._id, "loss", -1) || player.losses === 0}
                            className="h-8 w-8 p-0 rounded-md border border-[#204d34] bg-[#e0fbe0] text-[#204d34] hover:bg-[#c1e8b8]"
                          >
                            {isWLUpdating(player._id, "loss", -1) ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Minus size={16} />
                            }
                          </Button>
                        </div>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="h-8 w-8 p-0 rounded-md bg-[#b91c1c] text-white hover:bg-[#7f1d1d]"
                            aria-label="Delete player"
                            disabled={!!deletingPlayerIds[player._id]}
                          >
                            {deletingPlayerIds[player._id] ? 
                              <Loader2 className="h-4 w-4 animate-spin" /> : 
                              <Trash2 size={16} />
                            }
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-[#204d34]">Delete Player</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {player.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white text-[#204d34] border hover:bg-[#ecf7e8]">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeletePlayer(player._id)}
                              className="bg-[#b91c1c] hover:bg-[#7f1d1d] text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
