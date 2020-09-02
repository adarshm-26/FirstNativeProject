import React from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.viewLayout}>
      <Text style={styles.textLayout}>Loading...</Text>
      <ActivityIndicator size='large'/>
    </View>
  );
}

const styles = StyleSheet.create({
  viewLayout: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'cyan',
    flex: 1
  },
  textLayout: {
    fontSize: 20,
  }
});

export default SplashScreen;
