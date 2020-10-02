import 'react-native-gesture-handler';
import React, { useState, useReducer, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, LoginScreen, SplashScreen, RegisterScreen } from './Screens';
import { AsyncStorage } from 'react-native';
import auth, { firebase } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-community/google-signin';
import { LoginManager } from 'react-native-fbsdk';
import { Provider as PaperProvider, Appbar } from 'react-native-paper';
import theme from './Theme';
import { get } from './utils';

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

  GoogleSignin.configure({
    webClientId: "480516264780-3qdu9ff0cfpcd2t54s9gof3s220if60v.apps.googleusercontent.com"
  });

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        if (auth().currentUser) {
          const result = await get('myDetails');
          if (result) {
            data = {
              userData: {
                user: result,
                token: auth().currentUser.getIdToken()
              }
            }
            await AsyncStorage.setItem('authData', JSON.stringify(data));
            if (result.registered) {
              authContext.signIn(data);
            }
            else {
              console.log('Unregistered user, will force signOut');
              authContext.signOut();
            }
          }
          else throw new Error('User unregistered');
        }
        else throw new Error('User not found');
      } catch (e) {
        console.error(e);
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
        console.log('SignedIn...');
      },
      signOut: async () => {
        await GoogleSignin.signOut();   // Logout Google
        LoginManager.logOut();          // Logout FB
        await AsyncStorage.removeItem('authData'); // Clear local token
        await auth().signOut();         // Signal firebase for logout
        setStatus({ type: 'SIGN_OUT' });
        console.log('SignedOut...');
      }
    }),
    []
  );

  if (status.isLoading) {
    return <SplashScreen/>;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator>
            {status.userData !== null ? (
              <Stack.Screen
                name='Home'
                options={{ headerShown: false }}
                initialParams={{...status}}
                component={HomeScreen}
              />
            ) : (
              <>
                <Stack.Screen
                  name='Login'
                  options={{ headerShown: false }}
                  component={LoginScreen}
                />
                <Stack.Screen
                  name='Register'
                  options={{ headerShown: false }}
                  component={RegisterScreen}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </AuthContext.Provider>
  );
};

export default App;
