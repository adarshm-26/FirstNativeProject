import React from 'react';
import { Text, Switch, Title, Subheading, Paragraph } from 'react-native-paper';
import { TouchableOpacity, View, FlatList, AsyncStorage, ScrollView, Image } from 'react-native';
import SocketIOClient from 'socket.io-client';
import { Header } from './Components';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from './App';
import theme from './Theme';
import { SERVER_HOSTNAME, SOCKETIO_PORT } from './config';

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
          {item.configurationId ? 'Configured' : 'Unconfigured'}
      </Subheading>
    </View>
  </TouchableOpacity>   
  );
}

const MyDevices = ({ navigation }) => {
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
        navigation.navigate('Configure Device', {
          device: device
        });
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
      console.log('Status ' + configurationId + ' ' + JSON.stringify(state));
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

const Devices = ({ route, navigation }) => {
  return (
    <DevicesStack.Navigator
      headerMode='screen'
      screenOptions={{
        header: (props) => (
          <Header {...props} />
        ),
      }}
      initialRouteName='My Devices'>
      <DevicesStack.Screen
        name='My Devices'
        component={MyDevices}
        options={{ headerTitle: 'My Devices' }}
      />
      <DevicesStack.Screen
        name='Configure Device'
        component={ConfigureDevice}
        options={{ headerTitle: 'Configure Device' }}
      />
    </DevicesStack.Navigator>
  );
}

export default Devices;
