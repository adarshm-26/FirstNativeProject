import React from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import theme from './Theme';

const SplashScreen = () => {
  return (
    <View style={styles.viewLayout}>
      <ActivityIndicator size='large' color='white'/>
      <Text style={styles.textLayout}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  viewLayout: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    flex: 1
  },
  textLayout: {
    fontSize: 20,
    color: 'white'
  }
});

export default SplashScreen;
