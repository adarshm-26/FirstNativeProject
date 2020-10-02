import React from 'react';
import { Text, Switch, Title, Subheading, ActivityIndicator } from 'react-native-paper';
import { TouchableOpacity, View, FlatList, AsyncStorage, ScrollView, Image, PermissionsAndroid, Alert } from 'react-native';
import SocketIOClient from 'socket.io-client';
import { Header, StyledButton, TextInputField } from './Components';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import WifiManager from 'react-native-wifi-reborn';
import theme from './Theme';
import { SERVER_HOSTNAME, SOCKETIO_PORT } from './config';
import { getStoredData } from './utils';

const DevicesStack = createStackNavigator();

const DeviceLayout = ({ item, onPress }) => {
  return (
  <TouchableOpacity
    style={{ margin: 5, padding: 10, borderRadius: 10, backgroundColor: theme.colors.accent }}
    onPress={() => onPress(item)}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Title style={{ flex: 2 }}>{item.name}</Title>
      <Subheading 
        style={{ flex: 1, textAlign: 'right' }}>
          {item.configured ? 'Configured' : 'Unconfigured'}
      </Subheading>
    </View>
  </TouchableOpacity>   
  );
}

const MyDevices = ({ route, navigation }) => {
  const [devices,setDevices] = React.useState('');

  useFocusEffect(React.useCallback(() => {
    AsyncStorage.getItem('authData')
    .then(authData => {
      const { userData } = JSON.parse(authData);
      const arr = [];
      for (let configId in userData.user.devices) {
        arr.push({
          configurationId: configId,
          ...userData.user.devices[configId]
        });
      }
      setDevices(arr);
    })
    .catch(e => console.error);
  }, []));

  const renderDevices = ({ item }) => {
    return <DeviceLayout
      item={item}
      onPress={(device) => {
        if (item.configured) {
          navigation.navigate('Configure', {
            device: device
          });
        }
        else {
          Alert.alert('Prerequisites', 
            'Make sure your IoT device is turned on', [
              {
                text: 'Ok',
                onPress: () => {
                  WifiManager.setEnabled(true);
                },
                style: 'default'
              }
            ],
            { cancelable: false }
          );
          navigation.navigate('Setup', {
            device: device
          });
        }
      }}
    />
  }

  if (devices.length !== 0) {
    return (
      <>
        <FlatList
          data={devices}
          renderItem={renderDevices}
          keyExtractor={item => item.configurationId}
        />
      </>
    );
  } else {
    return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>You have 0 devices</Text>
    </View>);
  }
}

const ConfigureDevice = ({ route, navigation }) => {
  const [switches, setSwitchesState] = React.useState(route.params.device.state);
  const [socketObj, setSocketObj] = React.useState('');

  React.useEffect(() => {
    const socket = SocketIOClient(`${SERVER_HOSTNAME}:${SOCKETIO_PORT}`, {      
      transports: ['websocket'], 
      jsonp: false 
    });
    socket.connect(); 
    socket.on('connect', () => { 
      console.log('Connected to socket server');
      socket.emit('status', route.params.device.configurationId, {...switches});
    });
    socket.on('status', (configurationId, state) => {
      console.log('Status recieved ' + configurationId + ' : ' + JSON.stringify(state));
      if (route.params.device.configurationId === configurationId) {
        setSwitchesState({
          ...state
        });
      }
    });
    socket.on('connect_error', (err) => console.log(JSON.stringify(err)));
    socket.on('error', (err) => console.error(err));
    socket.on('disconnect', (reason) => console.log('Disconnected socket due to ' + reason))
    setSocketObj(socket);
    return (() => {
      socket.close();
    });
  }, []);

  const sendSwitchStatus = (value, switchNo) => {
    let state = {...switches};
    state[switchNo] = value;
    socketObj.emit('change', route.params.device.configurationId, state);
  }

  return (
  <ScrollView>
    <View style={{ flexDirection: 'row' }}>
      <Image 
        source={require('./images/device_001.jpeg')} 
        style={{ 
          flex: 1,
          aspectRatio: 1.33,
          resizeMode: 'contain'          
        }}
      />
    </View>
    <View style={{ padding: 30 }}>
      <Title>Description</Title>
      {
        Object.keys(route.params.device).map((key, index) => {
          if (typeof route.params.device[key] !== 'object') {
            return <View style={{ flexDirection: 'row', padding: 15 }}>
              <Subheading style={{ flex: 1 }}>{key}</Subheading>
              <Subheading style={{ flex: 1 }}>{route.params.device[key]}</Subheading>
            </View>
          }
        })
      }
      <Title>Configuration</Title>
      {
        Object.keys(switches).map((switchNo, index) => {
          return <View style={{ flexDirection: 'row', padding: 15 }}>
            <Subheading style={{ flex: 1 }}>{switchNo}</Subheading>
            <Switch
              style={{ flex: 1 }}
              key={index}
              value={switches[switchNo]} 
              onValueChange={(value) => sendSwitchStatus(value, switchNo)}
            />
          </View>
        })
      }
    </View>
  </ScrollView>
  );
}

const SetupDevice = ({ route, navigation }) => {
  const [availableNetworks, setNetworks] = React.useState([]);
  const [scanning, setScanning] = React.useState(false);
  
  React.useEffect(() => {
    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission is required to scan wifi networks',
        message:
          'This app needs location permission as this is required  ' +
          'to scan for wifi networks.',
        buttonNegative: 'DENY',
        buttonPositive: 'ALLOW',
      }
    ).then(result => {
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        setScanning(true);
        WifiManager.loadWifiList()
        .then(networks => setNetworks(networks))
        .catch(e => {
          alert('Could not scan for networks');
          console.error(e);
        })
        .finally(() => {
          setScanning(false);
        });  
      }
      else {
        alert('You need to allow location access for this app');
      }
    })
    .catch(e => {
      console.error(e);
      alert('Could not scan for networks');
    })
  }, []);

  const rescan = () => {
    setScanning(true);
    WifiManager.reScanAndLoadWifiList()
    .then(networks => setNetworks(networks))
    .catch(e => {
      alert('Failed, please retry');
      console.error(e);
    })
    .finally(() => {
      setScanning(false);
    });
  }

  return (<View style={{ margin: 5, padding: 10, flex: 1 }}>
    {
      scanning ?
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large'/>
      </View> :
      <View>
        {
          availableNetworks.length > 0 ? 
          availableNetworks.map((network, index) => {
            return (<TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(
                'Wifi', {
                  ssid: network.SSID,
                  device: route.params.device
                }
              )}
            >
              <Text style={{
                fontSize: 20,
                padding: 5
              }}>{network.SSID}</Text>
            </TouchableOpacity>);
          }) :
          <Text style={{
            fontSize: 20,
            padding: 5
          }}>No networks found</Text>
        }
        <StyledButton
          disabled={scanning}
          onPress={rescan}
          inner='Rescan'
        />
      </View>
    }
  </View>);
}

const ConfigureWifi = ({ route, navigation }) => {
  const [password, setPassword] = React.useState('');
  const [connecting, setConnecting] = React.useState(false);

  const attemptConnection = async () => {
    setConnecting(true);
    try{
      await WifiManager.connectToProtectedSSID(
        route.params.ssid,
        password,
        false
      );
      console.log('Connected to ' + route.params.ssid);
      await AsyncStorage.setItem('wifi', JSON.stringify({
        ssid: route.params.ssid,
        password: password
      }));
      /**
       * TODO :
       * Add actual IoT device configuration here
       * Also handle signal server after configuration to update database
       */
      let userData = await getStoredData();
      userData.userData.user.devices[route.params.device.configurationId].configured = true;
      let result = await AsyncStorage.setItem('authData', JSON.stringify(userData));
      navigation.navigate('My');
    } catch (e) {
      alert('Could not connect');
      console.error(e);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <View style={{ padding: 10 }}>
      <Text style={{
        fontSize: 20,
      }}>Enter Password for selected device network below</Text>
      <TextInputField
        label='Password'
        onChangeText={(value) => setPassword(value)}
        value={password}
        disabled={connecting}
      />
      <StyledButton
        disabled={connecting}
        onPress={attemptConnection}
        inner='Connect'
      />
    </View>
  );
}

const Devices = ({ route, navigation }) => {
  return (
    <DevicesStack.Navigator
      headerMode='screen'
      screenOptions={{
        header: (props) => (
          <Header {...props} />
        ),
      }}
      initialRouteName='My'>
      <DevicesStack.Screen
        name='My'
        component={MyDevices}
        options={{ headerTitle: 'My Devices' }}
      />
      <DevicesStack.Screen
        name='Configure'
        component={ConfigureDevice}
        options={{ headerTitle: 'Configure Device' }}
      />
      <DevicesStack.Screen
        name='Setup'
        component={SetupDevice}
        options={{ headerTitle: 'Setup Device' }}
      />
      <DevicesStack.Screen
        name='Wifi'
        component={ConfigureWifi}
        options={{ headerTitle: 'Configure Wifi' }}
      />
    </DevicesStack.Navigator>
  );
}

export default Devices;
