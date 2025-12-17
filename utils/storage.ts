import { User } from '../types';

const STORAGE_KEY = 'traffic_runner_users';

export const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load users", e);
    return [];
  }
};

export const saveUser = (email: string): User => {
  const users = getStoredUsers();
  const existing = users.find(u => u.email === email);
  
  if (existing) {
    // Update last played
    existing.lastPlayed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return existing;
  }

  const newUser: User = {
    email,
    highScore: 0,
    lastPlayed: Date.now()
  };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
};

export const updateUserScore = (email: string, score: number): User[] => {
  const users = getStoredUsers();
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex !== -1) {
    if (score > users[userIndex].highScore) {
      users[userIndex].highScore = Math.floor(score);
    }
    users[userIndex].lastPlayed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  return users;
};

export const deleteUser = (email: string): User[] => {
  let users = getStoredUsers();
  users = users.filter(u => u.email !== email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return users;
};
