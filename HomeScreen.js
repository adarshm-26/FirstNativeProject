import React, { useContext } from 'react';
import { Text, 
  View, 
  Button,
  StyleSheet,
  AsyncStorage
} from 'react-native';
import { AuthContext } from './App';

const HomeScreen = ({ navigation }) => {

  const { signOut } = useContext(AuthContext);  

  return (
    <View style={styles.viewLayout}>
      <Text style={styles.textLayout}>SignedIn</Text>
      <Button 
        onPress={() => {
          signOut();
        }}
        title='SignOut'/>
    </View>
  );
};

const styles = StyleSheet.create({
  viewLayout: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  textLayout: {
    fontSize: 20,
    padding: 20
  }
});

export default HomeScreen;
