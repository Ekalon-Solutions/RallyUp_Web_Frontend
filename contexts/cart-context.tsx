"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { analytics } from '../lib/analytics'

export interface CartItem {
  _id: string
  name: string
  price: number
  currency: string
  quantity: number
  featuredImage?: string
  stockQuantity: number
  tags?: string[]
  club: {
    _id: string
    name: string
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (itemId: string) => boolean
  getItemQuantity: (itemId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('rallyup-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('rallyup-cart', JSON.stringify(items))
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    analytics.logEvent('add_to_cart', {
      item_id: newItem._id,
      item_name: newItem.name,
      price: newItem.price,
      club_id: newItem.club?._id,
    });
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === newItem._id)
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > newItem.stockQuantity) {
          return prevItems
        }
        
        return prevItems.map(item =>
          item._id === newItem._id
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        return [...prevItems, { ...newItem, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    analytics.logEvent('remove_from_cart', { item_id: itemId });
    setItems(prevItems => prevItems.filter(item => item._id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setItems(prevItems => {
      const item = prevItems.find(item => item._id === itemId)
      if (!item) return prevItems

      const newQuantity = Math.min(quantity, item.stockQuantity)
      
      return prevItems.map(item =>
        item._id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    })
  }

  const clearCart = () => {
    analytics.logEvent('clear_cart', {});
    setItems([])
  }

  const isInCart = (itemId: string) => {
    return items.some(item => item._id === itemId)
  }

  const getItemQuantity = (itemId: string) => {
    const item = items.find(item => item._id === itemId)
    return item ? item.quantity : 0
  }

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
