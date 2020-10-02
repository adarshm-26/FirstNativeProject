import React, { useContext } from 'react';
import { Text, View, SafeAreaView, Picker } from 'react-native';
import { Headline, Card } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { TextInputField, StyledButton } from './Components';
import { AuthContext } from './App';
import theme from './Theme';
import { ScrollView } from 'react-native-gesture-handler';

const RegisterSchema = Yup.object().shape({
  firstname: Yup.string()
    .min(2, 'Too short')
    .max(20, 'Too long')
    .required('Required')
    .label('First name'),
  lastname: Yup.string()
    .min(2, 'Too short')
    .max(20, 'Too long')
    .required('Required')
    .label('Last name'),
  email: Yup.string()
    .email('Invalid address')
    .required('Required')
    .label('Email'),
  gender: Yup.string()
    .oneOf([
      'Male',
      'Female',
      'Other'
    ], 'Male, Female or Other')
    .required('Required')
    .label('Gender'),
  age: Yup.number()
    .min(18, 'Too young')
    .max(100, 'Too old')
    .required('Required')
    .label('Age'),
  phone: Yup.string()
    .matches(
      /^(\+\d{1,2})?1?\(?\d{3}\)?\d{3}?\d{3,4}$/,
      'Format as +[CC][10-digits]')
    .required('Required')
    .label('Phone')
});

const RegisterScreen = ({ route, navigation }) => {
  const { _id,
    firstname,
    lastname,
    email,
    gender,
    age,
    phone,
    token
  } = route.params;
  const { signIn } = useContext(AuthContext);

  return (<SafeAreaView style={{ 
    backgroundColor: theme.colors.primary,
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }}>
    <Card style={{ elevation: 4, width: '90%', padding: 5 }}>
    <ScrollView>
    <View>
      <Headline style={{ paddingLeft: '7%', paddingTop: '5%' }}>Register</Headline>
    </View>
    <Formik
      initialValues={{
        firstname: firstname,
        lastname: lastname,
        email: email,
        gender: gender,
        age: age,
        phone: phone
      }}
      validationSchema={RegisterSchema}
      onSubmit={async values => {
        console.log(values);
        let success = recordUser({
          _id: _id,
          ...values,
        }, token);
        if (success) {
          signIn({
            userData: {
              token: token,
              user: {
                ...values,
                registered: true
              }
            }
          });
        } else {
          alert('Registration failed');
        }
      }}
    >
      {({ handleChange, handleBlur, handleSubmit, isSubmitting, values, errors, touched }) => {
        return (
        <View style={{ alignSelf: 'stretch', padding: 20 }}>
          <View>
            <TextInputField
              label='First name'
              onChangeText={handleChange('firstname')}
              onBlur={handleBlur('firstname')}
              value={values.firstname}
              disabled={route.params.firstname}
            />
            <Text style={{ color: 'red' }}>
              {touched.firstname ? errors.firstname : '' }
            </Text>
          </View>
          <View>
            <TextInputField
              label='Last name'
              onChangeText={handleChange('lastname')}
              onBlur={handleBlur('lastname')}
              value={values.lastname}
              disabled={route.params.lastname}
            />
            <Text style={{ color: 'red' }}>
              {touched.lastname ? errors.lastname : '' }
            </Text>
          </View>
          <View>
            <TextInputField
              label='Email address'
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              disabled={route.params.email}
            />
            <Text style={{ color: 'red' }}>
              {touched.email ? errors.email : '' }
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Picker
                selectedValue={values.gender}
                onValueChange={handleChange('gender')}
              >
                <Picker.Item label='Male' value='Male'/>
                <Picker.Item label='Female' value='Female'/>
                <Picker.Item label='Other' value='Other'/>
              </Picker>
              <Text style={{ color: 'red' }}>
                {touched.gender ? errors.gender : '' }
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextInputField
                label='Age'
                type='number'
                onChangeText={handleChange('age')}
                onBlur={handleBlur('age')}
                value={values.age}
                disabled={route.params.age}
              />
              <Text style={{ color: 'red' }}>
                {touched.age ? errors.age : ''}
              </Text>
            </View>
          </View>
          <View>
            <TextInputField
              label='Phone'
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              value={values.phone}
              disabled={route.params.phone}
            />
            <Text style={{ color: 'red' }}>{errors.phone}</Text>
          </View>
          <View>
            <StyledButton 
              onPress={handleSubmit} 
              disabled={isSubmitting}
              inner='Register'/>
          </View>
        </View>
        )}}
    </Formik>
    </ScrollView>
    </Card>
  </SafeAreaView>);
}

const recordUser = async (userDetails, token) => {
  try {
    let response = await post('http://192.168.1.7:8080/record', userDetails);
    if (response) {
      return response
    }
    else {
      throw Error('Write result of /record is null');
    }
  } catch (e) {
    console.error(e);
    return false;
  }
}

export default RegisterScreen;
