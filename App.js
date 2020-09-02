import 'react-native-gesture-handler';
import React, { useState, useReducer, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import SplashScreen from './SplashScreen';
import { AsyncStorage } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-community/google-signin';
import { LoginManager } from 'react-native-fbsdk';

const Stack = createStackNavigator();
export const AuthContext = createContext();

const App: () => React$Node = () => {

  const [status, setStatus] = useReducer(
    (oldStatus, newStatus) => {
      switch (newStatus.type) {
        case 'SIGN_IN':
          return {
            isLoading: false,
            userData: newStatus.userData,
          };
        case 'SIGN_OUT':
          return {
            isLoading: false,
            userData: null
          };
      }
    },
    {
      isLoading: true,
      userData: null,
    }
  );

  // Setup Google Auth
  GoogleSignin.configure({
    webClientId: "480516264780-3qdu9ff0cfpcd2t54s9gof3s220if60v.apps.googleusercontent.com"
  });

  // Try to restore user
  useEffect(() => {
    const bootstrapAsync = async () => {
      let authData;
      try {
        authData = await AsyncStorage.getItem('authData');
        authData = JSON.parse(authData);
      } catch (e) {
        // Restoring token failed
      }

      if (authData !== null) {
        setStatus({ 
          type: 'SIGN_IN',
          isLoading: false,
          ...authData
        });
      }
      else {
        setStatus({
          type: 'SIGN_OUT',
        });
      }
    };
    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async data => {
        await AsyncStorage.setItem('authData', JSON.stringify({
          userData: data.userData,
        }));
        setStatus({ 
          type: 'SIGN_IN', 
          userData: data.userData,
        });
      },
      signOut: async () => {
        await GoogleSignin.signOut();   // Logout Google
        LoginManager.logOut();          // Logout FB
        await AsyncStorage.removeItem('authData'); // Clear local token
        await auth().signOut();         // Signal firebase for logout
        setStatus({ type: 'SIGN_OUT' });
      }
    }),
    []
  );

  if (status.isLoading) {
    return <SplashScreen/>;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName='Login'>
          {status.userData !== null ? (
            <>
              <Stack.Screen
                name='Home'
                component={HomeScreen}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name='Login'
                component={LoginScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default App;
