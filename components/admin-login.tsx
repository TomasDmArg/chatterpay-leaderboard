"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockKeyhole } from "lucide-react"

interface AdminLoginProps {
  onLogin: (token: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    try {
      // Verify the password by making a test request to the API
      const response = await fetch('/api/leaderboard', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ name: '' }) // Send empty name for validation only
      })

      if (response.status === 401) {
        toast({
          title: 'Authentication failed',
          description: 'Invalid password',
          variant: 'destructive',
        })
      } else if (response.status === 400) {
        // If we get a 400, it means our auth was successful but the payload was invalid
        // which is expected since we sent an empty player name
        localStorage.setItem('admin_token', password)
        onLogin(password)
        toast({
          title: 'Login successful',
          description: 'You are now logged in as admin',
        })
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to authenticate',
        variant: 'destructive',
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-[#204d34] text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole size={20} />
            Admin Login
          </CardTitle>
          <CardDescription className="text-[#e0fbe0]">
            Enter your admin password to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                className="border-[#deecdc]"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#204d34] hover:bg-[#17442e]"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 