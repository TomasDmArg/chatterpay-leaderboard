"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Leaderboard } from "@/components/leaderboard"
import { RulesSection } from "@/components/rules-section"
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from "framer-motion"
import { GlobeIcon, Trophy, TwitterIcon, UserX2Icon, X, XIcon } from "lucide-react"

type GameEvent = {
  id: string;
  message: string;
  timestamp: number;
  type?: 'win' | 'loss';
}

export default function Home() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const prevPlayersRef = useRef<any[]>([]);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  const generateGameEvents = (currentPlayers: any[], previousPlayers: any[]) => {
    if (!previousPlayers.length) return [];
    
    const newEvents: GameEvent[] = [];
    
    currentPlayers.forEach(player => {
      const playerId = player._id || player.id;
      
      const prevPlayer = previousPlayers.find(p => (p._id || p.id) === playerId);
      
      if (prevPlayer) {
        if (player.balance > prevPlayer.balance) {
          const amountWon = player.balance - prevPlayer.balance;
          newEvents.push({
            id: `win-${playerId}-${Date.now()}`,
            message: `${player.name} won $${amountWon} USDT`,
            timestamp: Date.now(),
            type: 'win'
          });
        } else if (player.wins > prevPlayer.wins && player.balance === prevPlayer.balance) {
          newEvents.push({
            id: `win-${playerId}-${Date.now()}`,
            message: `${player.name} won a game`,
            timestamp: Date.now(),
            type: 'win'
          });
        }
      }
    });
    
    return newEvents;
  };

  const handleLeaderboardUpdate = (players: any[]) => {
    const currentPlayers = JSON.parse(JSON.stringify(players));
    const previousPlayers = prevPlayersRef.current;
    
    if (previousPlayers.length > 0) {
      const newEvents = generateGameEvents(currentPlayers, previousPlayers);
      if (newEvents.length) {
        setEvents(prev => [...prev, ...newEvents]);
      }
    }
    
    prevPlayersRef.current = currentPlayers;
  };

  useEffect(() => {
    if (events.length > 0) {
      const timer = setTimeout(() => {
        setEvents(prev => prev.slice(1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [events]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6 tv-container">
        <div className="flex flex-col">
          <RulesSection />
          <div className="qr-container flex flex-row items-center justify-start bg-white rounded-lg shadow-lg p-4 border border-[#e0fbe0] gap-5 mt-3">
              <QRCodeSVG value="https://chatterpay.net" size={150} bgColor="#e0fbe0" fgColor="#17442e" />
              <div className="mt-2 text-left text-xl text-[#17442e] font-regular flex flex-col items-start justify-start">
                <h3 className="text-lg font-semibold">ChatterPay</h3>
                <p className="text-sm font-regular">
                  Don’t get left out anymore. Send money with just WhatsApp messages.
                </p>
                <div className="flex flex-col items-start justify-start mt-4 gap-1">
                  <div className="flex flex-row items-center justify-center gap-2 text-sm">
                    <GlobeIcon size={20} />
                    https://chatterpay.net
                  </div>
                  <div className="flex flex-row items-center justify-center gap-2 text-sm">
                    <TwitterIcon size={20} /> chatterpay
                  </div>
                </div>
              </div>
          </div>
        </div>
        <div className="flex flex-col">
          <Leaderboard onUpdatePlayers={handleLeaderboardUpdate} />
          
          <div 
            ref={eventsContainerRef} 
            className="mt-4 fixed bottom-10 right-10 z-50 space-y-3 max-w-sm"
            style={{ pointerEvents: 'none' }}
          >
            <AnimatePresence>
              {events.map((event, index) => {
                const isWin = event.type === 'win';
                const offsetY = index * 5;
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: offsetY, 
                      scale: 1,
                      transition: { 
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                        delay: index * 0.15
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.8, 
                      y: -20,
                      transition: { duration: 0.3 }
                    }}
                    className="pump-notification shadow-lg p-4 rounded-lg relative"
                    style={{
                      pointerEvents: 'all',
                      backgroundColor: '#204d34',
                      boxShadow: isWin 
                        ? '0 0 20px rgba(172, 242, 189, 0.8), 0 0 40px rgba(172, 242, 189, 0.4)' 
                        : '0 0 20px rgba(245, 197, 197, 0.8), 0 0 40px rgba(245, 197, 197, 0.4)',
                      zIndex: 1000 - index,
                      border: `2px solid ${isWin ? '#acf2bd' : '#f5c5c5'}`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`flex items-center justify-center rounded-full w-8 h-8 ${
                          isWin ? 'bg-[#14803a]' : 'bg-[#c53737]'
                        }`}
                      >
                        {isWin ? (
                          <Trophy size={14} className="text-[#e0fbe0]" />
                        ) : (
                          <X size={14} className="text-[#e0fbe0]" />
                        )}
                      </div>
                      <div className="text-[#e0fbe0] font-medium">{event.message}</div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#193c28]">
                      <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className={isWin ? 'h-full bg-[#acf2bd]' : 'h-full bg-[#f5c5c5]'}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
