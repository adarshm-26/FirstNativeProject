import React, { useState, useContext } from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Card, Divider } from 'react-native-paper';
import TextInputMask from 'react-native-text-input-mask';
import { TextInputField, StyledButton } from './Components';
import { AuthContext } from './App';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton } from '@react-native-community/google-signin';
import { AccessToken, LoginButton } from 'react-native-fbsdk';
import theme from './Theme';
import { get } from './utils';

const LoginScreen = ({ navigation }) => {
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSigninInProgress, setSigninProgress] = useState(false);
  const { signIn } = useContext(AuthContext);
  
  const regexp = /^(\+\d{1,2})?1?\(?\d{3}\)?\d{3}?\d{3,4}$/;
  const [isFetchOtp, setIsFetchOtp] = useState(false);

  const attemptSignIn = async (user, token) => {
    if (user && token) {
      const userDetails = await verifyUser(token);
      console.log('Verifying with server');
      if (userDetails && userDetails.registered) {
        console.log('Already registered, moving to HomeScreen');
        signIn({
          userData: {
            user: userDetails,
            token: token
          }
        });
      }
      else if (userDetails) {
        console.log('Unregistered user, moving to RegisterScreen');
        navigation.navigate('Register', {
          token: token,
          ...userDetails
        });
      }
      else {
        console.warn('Unable to verify user');
        alert('Could not verify user');
      }
    }
    else {
      console.error('Signin failed');
      alert('SignIn attempt failed');
    }
  }

  return (
    <>
      <SafeAreaView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: theme.colors.primary
      }}>
        <Card style={{ margin: 25, padding: 10, elevation: 4, height: isFetchOtp ? 450 : 380 }}>
          <Card.Title title='Login' subtitle='using OTP'/>
          <Card.Content>
            <TextInputField
              label='Phone'
              value={phoneNumber}
              render={props => 
                <TextInputMask 
                  {...props}
                  onChangeText={(formatted, extracted) => {
                    setPhoneNumber('+'+extracted);
                  }}
                  mask='+[00] [0000] [000] [000]'
                />
              }
            />
            {
              isFetchOtp ?
              <TextInputField
                label='OTP'
                value={otp}
                onChangeText={otp => setOtp(otp)}
              /> : <></>
            }
            <StyledButton
              onPress={ isFetchOtp ? 
                async () => {
                  try {
                    setSigninProgress(true);
                    console.log('Trying to sign in with: ' + phoneNumber);
                    const confirmationObj = await auth()
                      .signInWithPhoneNumber(phoneNumber);
                    const user = await confirmationObj.confirm(otp);
                    const token = await user.user.getIdToken();
                    
                    attemptSignIn(user, token);
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setSigninProgress(false);
                    setIsFetchOtp(false);
                  }
                } :
                () => setIsFetchOtp(true)
              }
              disabled={ isFetchOtp ? 
                isSigninInProgress : 
                !regexp.test(phoneNumber)
              }
              inner={ isFetchOtp ? 'SignIn' : 'Fetch OTP' }
            />
            <Divider style={{ marginTop: 20, marginBottom: 10 }}/>
            <GoogleSigninButton
              style={{ width: 258, height: 48, alignSelf: 'center', margin: 10 }}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Light}
              onPress={ async () => {
                try {
                  setSigninProgress(true);

                  const { idToken } = await GoogleSignin.signIn();
                  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

                  const user = await auth().signInWithCredential(googleCredential);
                  const token = await user.user.getIdToken();
                  
                  attemptSignIn(user, token);
                } catch (error) {
                  console.error(error);
                } finally {
                  setSigninProgress(false);
                }
              }}
              disabled={isSigninInProgress}
              
            />
            <View style={styles.viewLayout}>
              <LoginButton
                permissions={['email','public_profile']}
                style={{ width: 250, height: 34 }}
                onLoginFinished={ async (error, result) => {
                  if (error) {
                    console.error(error);
                  } else {
                    try {
                      setSigninProgress(true);
                      
                      let fbtoken, fbCredential;
                      if (!result.isCancelled) {
                        fbtoken = await AccessToken.getCurrentAccessToken();
                      }

                      if (fbtoken !== null) {
                        fbCredential = auth.FacebookAuthProvider.credential(fbtoken.accessToken);
                        const user = await auth().signInWithCredential(fbCredential);
                        const token = await user.user.getIdToken();

                        attemptSignIn(user, token);
                      }
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setSigninProgress(false);
                    }
                  }
                }}
              />
            </View>
          </Card.Content>
        </Card>
        </SafeAreaView>
    </>
  );
};

const verifyUser = async (token) => {
  try {
    const result = await get('http://192.168.1.7:8080/myDetails');
    if (result)
      return result;
    else
      throw new Error('Fetched user is null');
  } catch (err) {
    console.error(err);
    return null;
  }
}

const styles = StyleSheet.create({
  viewLayout: {
    margin: 10,
    backgroundColor: Colors.white,
    alignSelf: 'center',
  }
});

export default LoginScreen;
