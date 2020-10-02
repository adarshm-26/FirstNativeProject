import React from 'react';
import { View, FlatList, SafeAreaView, AsyncStorage } from 'react-native';
import { Title, Text, Subheading, ActivityIndicator, Card, Paragraph, TouchableRipple } from 'react-native-paper';
import { createStackNavigator } from '@react-navigation/stack';
import { Header, StyledButton } from './Components';
import Icon from 'react-native-vector-icons/MaterialIcons';
import theme from './Theme';
import { AuthContext } from './App';
import { post, get, getStoredData } from './utils';

const Stack = createStackNavigator();

const ShopDevices = ({ route, navigation }) => {
  const data = [
    '2 Channel with normal load capacity, 6 amps device',
    '4 Channel with normal load capacity, 6 amps device',
    '8 Channel with normal load capacity, 6 amps device',
    '1 Channel heavy load with 30 amps capacity'
  ];
  return (
    <View>
      {
        data.map((category, index) => <Card style={{ 
          margin: 5, 
          padding: 10, 
          backgroundColor: theme.colors.accent
        }}
        key={index}>
          <TouchableRipple onPress={() => {
            navigation.navigate('Get Devices', {
              category: category
            })
          }}>
            <Paragraph style={{ fontSize: 18 }}>{category}</Paragraph>
          </TouchableRipple>
        </Card>)
      }
    </View>
  );
}

const DeviceLayout = ({ item, onPress }) => {
  const device_img = `./images/device_001.jpeg`;
  return (
  <Card style={{ margin: 10 }}>
    <Card.Cover source={require(device_img)}/>
    <View>
      <View style={{ paddingHorizontal: 10, flexDirection: 'row', width: '100%' }}>
        <Title>{item.name}</Title>
        <Subheading style={{ marginLeft: 'auto' }}>Rs.{item.price}</Subheading>
      </View>
      <View style={{ padding: 10, flexDirection: 'row', width: '100%', justifyContent: 'flex-end' }}>
        <StyledButton
          inner='Buy'
          onPress={onPress}/>
      </View>
    </View>
  </Card>  
  );
}

const GetDevice = ({ route, navigation }) => {
  const [loading, setLoading] = React.useState(true);
  const [devices, setDevices] = React.useState([]);
  const { signIn } = React.useContext(AuthContext);
  const fetchDevices = async () => {
    try {
      let result = await get('http://192.168.1.7:8080/store/getDevices');
      setDevices(result);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  const renderDevices = ({ item }) => {
    return <DeviceLayout
      item={item}
      onPress={ async () => {
        try {
          let result = await post('http://192.168.1.7:8080/store/buy', item);
          if (result) {
            let data = await getStoredData();
            signIn({
              userData: {
                token: data.userData.token,
                user: result
              }
            })
            alert('Bought ' + item.name);
          }
        } catch (e) {
          console.error(e);
          alert('Could not buy ' + item._id);
        }
      }}
    />
  }

  React.useEffect(() => {
    fetchDevices();
  }, []);

  if (loading) {
    return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator/>
    </View>);
  }

  if (devices.length !== 0) {
    return (
      <>
        <FlatList
          data={devices}
          renderItem={renderDevices}
          keyExtractor={item => item._id}
        />
      </>
    );
  } else {
    return (<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Icon.Button
        name='refresh'
        style={{
          color: theme.colors.primary,
          backgroundColor: theme.colors.surface
        }}
        onPress={() => {
          setLoading(true);
        }}
        size={30}
      />
    </View>);
  }
}

const Shop = ({ route, navigation }) => {
  return (
    <Stack.Navigator 
      headerMode="screen"
      screenOptions={{
        header: ({ scene, previous, navigation }) => (
          <Header scene={scene} previous={previous} navigation={navigation} />
        ),
      }}
      initialRouteName="Shop Devices">
      <Stack.Screen
        name='Shop Devices'
        component={ShopDevices}
      />
      <Stack.Screen
        name='Get Devices'
        component={GetDevice}
      />
    </Stack.Navigator>
  );
}

export default Shop;
