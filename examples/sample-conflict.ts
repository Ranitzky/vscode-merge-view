// Sample file with multiple typical Git merge conflicts

import { useState, useEffect } from 'react';

<<<<<<< HEAD
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
=======
export interface UserProfile {
  id: string;
  fullName: string;
  emailAddress: string;
  avatarUrl?: string;
  permissions: string[];
  role: 'admin' | 'moderator' | 'user';
  updatedAt: Date;
}
>>>>>>> feature/user-permissions-update

export function formatGreeting(user: UserProfile): string {
<<<<<<< HEAD
  console.log('Rendering header greeting for user:', user.name);
  return `Welcome back, ${user.name}!`;
=======
  console.log('Rendering greeting with role:', user.role);
  return `Hello, ${user.fullName} (${user.role})`;
>>>>>>> feature/user-permissions-update
}

export function calculateDiscount(price: number, isVip: boolean): number {
  if (isVip) {
<<<<<<< HEAD
    // 25% VIP Discount
    return price * 0.75;
=======
    // 30% Special Promotion VIP Discount
    return price * 0.70;
>>>>>>> feature/user-permissions-update
  }
  return price;
}
