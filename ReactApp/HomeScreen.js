import React from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { Caption, Title, Drawer } from 'react-native-paper'; 
import Icon from 'react-native-vector-icons/Entypo';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Devices, Shop } from './Screens';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { AuthContext } from './App';
import { getStoredData } from './utils';

const DrawerNav = createDrawerNavigator();

const DrawerContent = (props) => {
  const { signOut } = React.useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Icon.Button
              name='user'
              color='#000000'
              backgroundColor='#ffffff'
              size={30}
            />
          </View>
          <View style={{ flex: 3 }}>
            <Title style={styles.title}>{props.params.userData.user.firstname}</Title>
            <Caption 
              style={styles.caption}>
                {props.params.userData.user.devices ?
                Object.keys(props.params.userData.user.devices).length :
                'No'} devices
            </Caption>
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Icon.Button
              name='log-out'
              color='#000000'
              backgroundColor='#ffffff'
              size={30}
              onPress={() => {
                Alert.alert('Logging Out', 
                  'Are you sure you want to logout ?', [
                    {
                      text: 'No',
                      onPress: () => console.log('Cancelled logout event'),
                      style: 'cancel'
                    },
                    {
                      text: 'Yes',
                      onPress: signOut,
                      style: 'default'
                    }
                  ],
                  { cancelable: false }
                );
              }}
            />
          </View>
        </View>
        <Drawer.Section title="Go to">
          <TouchableOpacity
            onPress={() => props.navigation.navigate('Devices', {...props.params})}>
            <View style={styles.preference}>
              <Text>Devices</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => props.navigation.navigate('Shop', {...props.params})}>
            <View style={styles.preference}>
              <Text>Shop</Text>
            </View>
          </TouchableOpacity>
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

const HomeScreen = ({ route ,navigation }) => {
  return (
    <DrawerNav.Navigator 
      drawerContent={() => <DrawerContent 
      params={route.params}
      navigation={navigation}/>}
      >
      <DrawerNav.Screen 
        name='Devices'
        initialParams={{...route.params}}
        component={Devices}
      />
      <DrawerNav.Screen
        name='Shop'
        initialParams={{...route.params}}
        component={Shop}
      />
    </DrawerNav.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 10,
    flexDirection: 'row'
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
