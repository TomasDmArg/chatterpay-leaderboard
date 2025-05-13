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
import { AdminLogin } from "./admin-login"

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authToken, setAuthToken] = useState<string>('')
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [balanceChange, setBalanceChange] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  
  // Individual loading states
  const [isBalanceUpdating, setIsBalanceUpdating] = useState(false)
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false)
  const [updatingPlayerIds, setUpdatingPlayerIds] = useState<Record<string, boolean>>({})
  const [deletingPlayerIds, setDeletingPlayerIds] = useState<Record<string, boolean>>({})

  // Check if token exists in localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token')
    if (storedToken) {
      setAuthToken(storedToken)
      setIsAuthenticated(true)
    }
  }, [])

  // Fetch players when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPlayers()
    }
  }, [isAuthenticated])

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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
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
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
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
      const response = await fetch(`/api/leaderboard?id=${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        toast({ title: "Success", description: "Player deleted successfully" })
      } else {
        // Restore player on error
        setPlayers(oldPlayers)
        toast({ title: "Error", description: "Failed to delete player", variant: "destructive" })
      }
    } catch (error) {
      // Restore player on error
      setPlayers(oldPlayers)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setDeletingPlayerIds(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleUpdateWL = async (id: string, type: "win" | "loss", delta: number) => {
    // Find player and calculate new values
    const player = players.find(p => p._id === id)
    if (!player) return
    
    // Key for tracking update state
    const updateKey = `${id}-${type}-${delta > 0 ? "inc" : "dec"}`;
    
    // Optimistically update UI
    const oldPlayers = [...players]
    setPlayers(players.map(p => {
      if (p._id !== id) return p;
      
      return {
        ...p,
        [type === "win" ? "wins" : "losses"]: Math.max(0, p[type === "win" ? "wins" : "losses"] + delta)
      };
    }))
    
    // Mark as updating
    setUpdatingPlayerIds(prev => ({ ...prev, [updateKey]: true }))
    
    try {
      const response = await fetch(`/api/leaderboard`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          playerId: id,
          type,
          delta
        })
      })
      
      if (response.ok) {
        const result = await response.json();
        // No need to update players here as we already did it optimistically
        toast({ 
          title: "Success", 
          description: `Updated ${player.name}'s ${type === "win" ? "wins" : "losses"}`
        })
      } else {
        // Revert on error
        setPlayers(oldPlayers)
        toast({ title: "Error", description: "Failed to update record", variant: "destructive" })
      }
    } catch (error) {
      // Revert on error
      setPlayers(oldPlayers)
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setUpdatingPlayerIds(prev => ({ ...prev, [updateKey]: false }))
    }
  }

  const isWLUpdating = (id: string, type: string, delta: number) => {
    const key = `${id}-${type}-${delta > 0 ? "inc" : "dec"}`;
    return updatingPlayerIds[key] || false;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setAuthToken('')
    setIsAuthenticated(false)
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <AdminLogin onLogin={(token) => {
      setAuthToken(token)
      setIsAuthenticated(true)
    }} />
  }

  // Show admin panel if authenticated
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#17442e]">Admin Panel</h1>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Add player */}
        <div className="bg-white p-6 rounded-lg border border-[#deecdc] shadow-sm">
          <h2 className="text-xl font-semibold text-[#17442e] mb-4">Create New Player</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Player Name</Label>
              <div className="flex gap-2">
                <Input
                  id="playerName"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="flex-1"
                />
                <Button 
                  onClick={handleCreatePlayer} 
                  disabled={isCreatingPlayer || !newPlayerName.trim()}
                  className="bg-[#17442e] hover:bg-[#123020]"
                >
                  {isCreatingPlayer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Update balance */}
        <div className="bg-white p-6 rounded-lg border border-[#deecdc] shadow-sm">
          <h2 className="text-xl font-semibold text-[#17442e] mb-4">Update Balance</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerSelect">Select Player</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player._id} value={player._id}>
                      {player.name} (Balance: ${player.balance} USDT)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceChange">Amount Change</Label>
              <div className="flex gap-2">
                <Input
                  id="balanceChange"
                  type="number"
                  value={balanceChange}
                  onChange={(e) => setBalanceChange(e.target.value)}
                  placeholder="Enter amount (positive or negative)"
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpdateBalance} 
                  disabled={isBalanceUpdating || !selectedPlayer || !balanceChange}
                  className="bg-[#17442e] hover:bg-[#123020]"
                >
                  {isBalanceUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player table */}
      <div className="bg-white rounded-lg border border-[#deecdc] shadow-sm overflow-hidden">
        <h2 className="text-xl font-semibold text-[#17442e] p-4 border-b border-[#deecdc]">Players</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f0f9ed]">
                <th className="text-left p-4 font-semibold text-[#17442e]">Name</th>
                <th className="text-center p-4 font-semibold text-[#17442e]">Balance</th>
                <th className="text-center p-4 font-semibold text-[#17442e]">Wins</th>
                <th className="text-center p-4 font-semibold text-[#17442e]">Losses</th>
                <th className="text-right p-4 font-semibold text-[#17442e]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length > 0 ? (
                players.map((player) => (
                  <tr key={player._id} className="border-t border-[#deecdc]">
                    <td className="p-4 font-medium">{player.name}</td>
                    <td className="p-4 text-center">${player.balance} USDT</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleUpdateWL(player._id, "win", -1)}
                          disabled={player.wins <= 0 || isWLUpdating(player._id, "win", -1)}
                        >
                          {isWLUpdating(player._id, "win", -1) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="w-8 text-center">{player.wins}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleUpdateWL(player._id, "win", 1)}
                          disabled={isWLUpdating(player._id, "win", 1)}
                        >
                          {isWLUpdating(player._id, "win", 1) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleUpdateWL(player._id, "loss", -1)}
                          disabled={player.losses <= 0 || isWLUpdating(player._id, "loss", -1)}
                        >
                          {isWLUpdating(player._id, "loss", -1) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="w-8 text-center">{player.losses}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleUpdateWL(player._id, "loss", 1)}
                          disabled={isWLUpdating(player._id, "loss", 1)}
                        >
                          {isWLUpdating(player._id, "loss", 1) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deletingPlayerIds[player._id]}>
                            {deletingPlayerIds[player._id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Player</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {player.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePlayer(player._id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No players found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
