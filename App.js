import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add Dependency
import * as ImagePicker from 'expo-image-picker' // Add dependency

// Default user that will be displayed when no user has been created
const defaultUser = {
  firstName: 'John',
  lastName: 'Doe',
  dob: '1990-01-01',
  nationality: 'American',
  shortBio: 'Software Engineer.',
   picture: 'https://aboutreact.com/wp-content/uploads/2018/07/react_native_imageview.png'
};

// Component that renders the user information
const UserProfile = ({ user }) => (
  <View style={styles.profileContainer}>
    <View style={styles.imageContainer}>
      {user.picture ? (
        // Render Picture from Device
        <Image
          source={{ uri: user.picture }}
          style={styles.profilePicture}
        />
            ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.imageText}>No Image</Text> 
        </View>
            )}
    </View>

    <View style={styles.userInfoContainer}>
      <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
      <Text style={styles.infoText} >Date of Birth: {user.dob}</Text>
      <Text style={styles.infoText} >Nationality: {user.nationality}</Text>
      <Text style={styles.shortBioHeader}>Short Bio:</Text>
      <Text style={styles.shortBio} >{user.shortBio}</Text>
    </View>
  </View>
);

// Modal used to Create and Edit an user
const UsersModal = ({status, data, onClose, saveUser, handleInputChange, pickImage, errors }) => {
  return(
    <Modal visible={status} animationType="slide">
      <View style={styles.modalContainer}>
        <TextInput style={styles.input} placeholder="First Name" value={data.firstName} onChangeText={(text) => handleInputChange('firstName', text)} />
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

        <TextInput style={styles.input} placeholder="Last Name" value={data.lastName} onChangeText={(text) => handleInputChange('lastName', text)} />
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

        <TextInput style={styles.input} placeholder="Date of Birth" value={data.dob} onChangeText={(text) => handleInputChange('dob', text)} />
        {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

        <TextInput style={styles.input} placeholder="Nationality" value={data.nationality} onChangeText={(text) => handleInputChange('nationality', text)} />
        {errors.nationality && <Text style={styles.errorText}>{errors.nationality}</Text>}

        <TextInput style={styles.input} placeholder="Short Bio" value={data.shortBio} onChangeText={(text) => handleInputChange('shortBio', text)} />
        {errors.shortBio && <Text style={styles.errorText}>{errors.shortBio}</Text>}

        <Pressable onPress={pickImage}>
          <Text style={styles.buttonImg}>Upload an Image</Text>
        </Pressable>
        <Pressable onPress={saveUser}><Text style={styles.button}>Save</Text></Pressable>
        <Pressable onPress={onClose}><Text style={styles.button}>Cancel</Text></Pressable>
      </View>
    </Modal>
  )
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newUser, setNewUser] = useState(defaultUser);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

// Function to render all users available in the AsyncStorage
  const loadUsers = useCallback(async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const parsedUsers = storedUsers ? JSON.parse(storedUsers) : [defaultUser];
      setUsers(parsedUsers);
      setSelectedUser(parsedUsers[0]);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  // Load all available users
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInputChange = useCallback((field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  }, []);

// Function to upload and store an image from the user
  const pickImage = useCallback(async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });
    
    if (!result.canceled) {
      setNewUser((prev) => ({ ...prev, picture: result.assets[0].uri })); //Update picture property from user if everything is correct
    }
  }, []);

// Input validation
  const validateInputs = useCallback(() => {
    let newErrors = {};
    const dobFormat = /^\d{4}-\d{2}-\d{2}$/;
    
    // Using trim to test input information with no spaces
    if (!newUser.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!newUser.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!newUser.dob.trim()) newErrors.dob = 'Date of Birth is required';
    else if (!dobFormat.test(newUser.dob)) {
    newErrors.dob = 'Date of Birth must be in the format YYYY-MM-DD';
    }
    if (!newUser.nationality.trim()) newErrors.nationality = 'Nationality is required';
    if (!newUser.shortBio.trim()) newErrors.shortBio = 'Short Bio is required';

    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  }, [newUser]);  


// Store updated or created user in the async storage
  const saveUser = useCallback(async () => {
    if (!validateInputs()) return; // Stop if validation fails
    
    const updatedUsers = isEditing
      ? users.map((u) => (u === selectedUser ? newUser : u))
      : [...users, newUser];

    setUsers(updatedUsers); // Update users list with new user
    setSelectedUser(newUser); // Render new user
    setIsModalVisible(false); // Hide Modal when an editing/creating is performed
    setIsEditing(false); 
    setErrors({}); // Reset errors after successful save
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
  }, [users, newUser, selectedUser, isEditing]);

  // Function to delete users
  const deleteUser = useCallback(async () => {
    const filteredUsers = users.filter(u => u !== selectedUser); // Remove selected users from filtered users to simulate deletion
    setUsers(filteredUsers); // Render the updated lists of users without the deleted user
    setSelectedUser(filteredUsers.length > 0 ? filteredUsers[0] : defaultUser); // Selected users will now be whether the default user or the most recently created one 
    await AsyncStorage.setItem('users', JSON.stringify(filteredUsers));
}, [users, selectedUser]);


  return (
    //List to display all available users
    <SafeAreaView style={styles.container}>
      {selectedUser && <UserProfile user={selectedUser} />}
      <ScrollView style={styles.scrollView}> 
        <FlatList
          data={users}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedUser(item)} style={styles.userItem}>
              <Text>{item.firstName} {item.lastName}</Text>
            </Pressable>
          )}
        />
      </ScrollView>
      
      <Pressable onPress={() => { setNewUser(defaultUser); setIsEditing(false); setIsModalVisible(true); }}>
        <Text style={styles.button}>Create User</Text>
      </Pressable>
      <Pressable onPress={() => { setNewUser(selectedUser); setIsEditing(true); setIsModalVisible(true); }}>
        <Text style={styles.button}>Edit User</Text>
      </Pressable>
      <Pressable onPress={deleteUser}>
        <Text style={styles.buttonDelete}>Delete User</Text>
      </Pressable>


      <UsersModal
        status={isModalVisible}
        data={newUser}
        onClose={() => setIsModalVisible(false)}
        saveUser={saveUser}
        handleInputChange={handleInputChange}
        pickImage={pickImage}
        errors={errors}
      />
      

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5' 
    },
  profileContainer: { 
    alignItems: 'center', 
    marginBottom: 20 ,
    padding: 20
    },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfoContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  shortBioHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  shortBio: {
    fontSize: 16,
    color: '#555',
    textAlign: 'justify',
    lineHeight: 22,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  userItem: { 
    padding: 10, 
    backgroundColor: '#ddd', 
    marginVertical: 5, 
    borderRadius: 5 
    },
  button: { 
    backgroundColor: 'blue', 
    color: 'white', 
    padding: 10, 
    textAlign: 'center', 
    marginVertical: 5, 
    borderRadius: 5 
    },
  buttonImg: {
    width: 250, height: 40,
    backgroundColor: 'tomato',
    marginBottom: 10, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ccc',
    textAlign: 'center', 
    paddingVertical: 10,
    color: '#fff'
    },
    buttonDelete: {
      backgroundColor: 'tomato',
      marginBottom: 10, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: '#ccc',
      textAlign: 'center', 
      paddingVertical: 10,
      color: '#fff'
    },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'white' 
    },
  input: { 
    width: 250, 
    height: 40, 
    backgroundColor: '#fff', 
    marginBottom: 10, 
    paddingHorizontal: 10, 
    borderRadius: 5, 
    borderWidth: 1, 
    borderColor: '#ccc' 
    },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 5,
    },

 }
);
