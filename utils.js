import React, { AsyncStorage } from 'react-native';
import auth from '@react-native-firebase/auth';

export const getStoredData = async () => {
  let authData = await AsyncStorage.getItem('authData');
  let userData = JSON.parse(authData);
  return userData;
}

export const post = async (url, body) => {
  try {
    let token = await auth().currentUser.getIdToken(true);
    let response = await fetch(url, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    if (response.ok) {
      let data = await response.json();
      return data;
    }
    else {
      throw new Error(response.statusText);
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}

export const get = async (url, idToken) => {
  try {
    let token = await auth().currentUser.getIdToken(true);
    let response = await fetch(url, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    if (response.ok) {
      let data = await response.json();
      return data;
    }
    else {
      throw new Error(response.statusText);
    }
  } catch (e) {
    console.error(e);
    return null;
  }
}
