import React, { useState, useContext } from 'react';
import { Text, 
  View, 
  TextInput, 
  Button, 
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

import { AuthContext } from './App';
import auth from '@react-native-firebase/auth';
import { GoogleSignin,
  GoogleSigninButton } from '@react-native-community/google-signin';
import { AccessToken, LoginButton } from 'react-native-fbsdk';

const LoginScreen = ({ navigation }) => {

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSigninInProgress, setSigninProgress] = useState(false);
  const { signIn } = useContext(AuthContext);

  const regexp = /^\+[0-9]?()[0-9](\s|\S)(\d[0-9]{8,16})$/;
  const [isFetchOtp, setIsFetchOtp] = useState(false);

  return (
    <>
      <StatusBar barStyle='dark-content' />
      <SafeAreaView style={styles.container}>
        <View style={styles.viewLayout}>
          <View>
            <TextInput
              style={styles.textLayout}
              placeholder='Enter Phone Number'
              onChangeText={val => setPhoneNumber(val)}
              defaultValue={phoneNumber}
            />
          </View>
          {
            isFetchOtp ?
            <View>
              <TextInput
                style={styles.textLayout}
                placeholder='Enter OTP'
                onChangeText={val => setOtp(val)}
                defaultValue={otp}
              />
              <Button 
                style={styles.signInButtonViewLayout} 
                onPress={ async () => {
                  try {
                    setSigninProgress(true);
                    
                    const confirmationObj = await auth().signInWithPhoneNumber(phoneNumber);
                    const user = await confirmationObj.confirm(otp);
                    if (user !== null) {
                      signIn({
                        userData: user.user
                      });
                    }
                    else {
                      alert('SignIn with OTP failed');
                    }
                  } catch (error) {
                    console.log('Error while OTP signIn: ' + error.message);
                  } finally {
                    setSigninProgress(false);
                    setIsFetchOtp(false);
                  }
                }} 
                title='Sign In'
                disabled={isSigninInProgress}
              />
            </View> :
            <View>
              <Button
                style={styles.signInButtonViewLayout} 
                onPress={() => {
                  setIsFetchOtp(true);                  
                }} 
                title='Fetch OTP'
                disabled={!regexp.test(phoneNumber)}
              />
            </View>
          }
          <View style={styles.signInButtonViewLayout}>
            <GoogleSigninButton
              onPress={ async () => {
                try {
                  setSigninProgress(true);

                  const { idToken } = await GoogleSignin.signIn();
                  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

                  const user = await auth().signInWithCredential(googleCredential);

                  if (user !== null) {
                    signIn({
                      userData: user.user
                    });
                  }
                  else {
                    alert('Could SignIn through Google');
                  }
                } catch (error) {
                  console.log('Error while Google signIn: ' + error.message);
                } finally {
                  setSigninProgress(false);
                }
              }}
              disabled={isSigninInProgress}
            />
          </View>
          <View style={styles.signInButtonViewLayout}>
            <LoginButton
              permissions={['email']}
              onLoginFinished={ async (error, result) => {
                if (error) {
                  console.log('Error while FB login: ' + error.message);
                } else {
                  try {
                    setSigninProgress(true);
                    
                    let token, fbCredential;
                    if (!result.isCancelled) {
                      token = await AccessToken.getCurrentAccessToken();
                    }

                    if (token) {
                      fbCredential = auth.FacebookAuthProvider.credential(token.accessToken);
                      const user = await auth().signInWithCredential(fbCredential);
                      if (user !== null) {
                        signIn({
                          userData: user.user
                        });
                      } else {
                        alert('Could not SignIn through Facebook');
                      }
                    }
                  } catch (error) {
                    console.log('Error while fetching token: ' + error.message);
                  } finally {
                    setSigninProgress(false);
                  }
                }
              }}
              onLogoutFinished={() => {}}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.lighter,
    flex:1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  viewLayout: {
    padding: 10,
    borderWidth: 1,
    backgroundColor: Colors.white,
    alignSelf: 'center',
  },
  textLayout: {
    height: 50,
    width: 300,
    fontSize: 24,
    padding: 10,
    margin: 10,
    alignSelf: 'center',
    borderStyle: 'solid',
    borderRadius: 5,
    borderWidth: 2
  },
  label: {
    padding: 10,
    fontSize: 24,
    alignSelf: 'flex-start'
  },
  signInButtonViewLayout: {
    justifyContent: 'center',
    padding: 10,
    alignSelf: 'center'
  },
});

export default LoginScreen;
