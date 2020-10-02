import React from 'react';
import { Appbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Entypo';
import theme from '../Theme';

const Header = ({ scene, previous, navigation }) => {
  const { options } = scene.descriptor;
  const title =
    options.headerTitle !== undefined
      ? options.headerTitle
      : options.title !== undefined
      ? options.title
      : scene.route.name;

  return (
    <Appbar.Header>
      {previous ? (
        <Appbar.BackAction
          onPress={() => navigation.pop()}
        />
      ) : (
        <Icon.Button
          name='menu'
          backgroundColor={theme.colors.primary}
          onPress={() => navigation.openDrawer()}
        />
      )}
      <Appbar.Content
        title={title}
      />
    </Appbar.Header>
  );
};

export default Header;
