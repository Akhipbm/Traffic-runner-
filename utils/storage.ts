import { User } from '../types';

const STORAGE_KEY = 'traffic_runner_users_v2'; // Changed key to reset/avoid conflict with email version

export const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load users", e);
    return [];
  }
};

export const saveUser = (username: string): User => {
  const users = getStoredUsers();
  const existing = users.find(u => u.username === username);
  
  if (existing) {
    // Update last played
    existing.lastPlayed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return existing;
  }

  const newUser: User = {
    username,
    highScore: 0,
    lastPlayed: Date.now()
  };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUserScore = (username: string, score: number): User[] => {
  const users = getStoredUsers();
  const userIndex = users.findIndex(u => u.username === username);
  
  if (userIndex !== -1) {
    if (score > users[userIndex].highScore) {
      users[userIndex].highScore = Math.floor(score);
    }
    users[userIndex].lastPlayed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  return users;
};

export const deleteUser = (username: string): User[] => {
  let users = getStoredUsers();
  users = users.filter(u => u.username !== username);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return users;
};