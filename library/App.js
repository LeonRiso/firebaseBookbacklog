import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';
import { db, storage } from './firebaseconfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary } from 'react-native-image-picker';

export default function App() {
  const [nomeLivro, setNomeLivro] = useState('');
  const [autorLivro, setAutorLivro] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [Books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [booksRead, setBooksRead] = useState([]);

  const selecionarImagem = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.error('ImagePicker Error: ', response.error);
      } else {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const fetchBooks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'livros'));
      const booksList = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setBooks(booksList);
      setCurrentlyReading(booksList.filter(book => book.status === "currently reading"));
      setBooksRead(booksList.filter(book => book.status === "read"));
    } catch (e) {
      console.error("Erro ao buscar livros: ", e);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return null;

    const response = await fetch(imageUri);
    const blob = await response.blob();
    const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
    const storageRef = ref(storage, `books/${filename}`);
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const adicionarOuAtualizarLivro = async () => {
    try {
      setLoading(true);
      const imageUrl = await uploadImage();
  
      if (editingBookId) {
        const livroRef = doc(db, 'livros', editingBookId);
        await updateDoc(livroRef, {
          nome: nomeLivro,
          autor: autorLivro,
          imageUrl: imageUrl || null,
          status: "currently reading"
        });
        alert('Livro atualizado com sucesso!');
        setEditingBookId(null); // Reset after editing
      } else {
        await addDoc(collection(db, 'livros'), {
          nome: nomeLivro,
          autor: autorLivro,
          imageUrl: imageUrl || null,
          status: "currently reading"
        });
        alert('Livro adicionado com sucesso!');
      }
  
      setNomeLivro('');
      setAutorLivro('');
      setImageUri(null);
      fetchBooks();
    } catch (e) {
      console.error("Erro ao salvar livro: ", e);
    } finally {
      setLoading(false);
    }
  };

  const updateBookStatus = async (bookId, newStatus) => {
    const bookRef = doc(db, 'livros', bookId);
    await updateDoc(bookRef, { status: newStatus });
    alert(`Livro marcado como ${newStatus === 'read' ? 'Lido' : 'Lendo'}`);
    fetchBooks();
  };

  const editarLivro = (book) => {
    setNomeLivro(book.nome);
    setAutorLivro(book.autor);
    setImageUri(book.imageUrl);
    setEditingBookId(book.id);
  };

  const excluirLivro = async (bookId) => {
    try {
      await deleteDoc(doc(db, 'livros', bookId));
      alert('Livro excluído com sucesso!');
      fetchBooks();
    } catch (e) {
      console.error("Erro ao excluir livro: ", e);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.bookItem}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.bookImage} />
      ) : (
        <Icon name="book" size={50} color="#4682b4" style={styles.bookIcon} />
      )}
      <View style={styles.bookDetails}>
        <Text style={styles.bookName}>{item.nome}</Text>
        <Text style={styles.bookAuthor}>{item.autor}</Text>
      </View>
      <View style={styles.actionButtons}>
        {item.status === 'currently reading' && (
          <TouchableOpacity onPress={() => updateBookStatus(item.id, 'read')} style={styles.actionButton}>
            <Text>Read</Text>
          </TouchableOpacity>
        )}
        {item.status === 'read' && (
          <TouchableOpacity onPress={() => updateBookStatus(item.id, 'currently reading')} style={styles.actionButton}>
            <Text>Reading</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => editarLivro(item)} style={styles.actionButton}>
          <Text>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirLivro(item.id)} style={styles.actionButton}>
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Livros</Text>
      
      <Text style={styles.label}>Nome do Livro</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o nome do livro"
        value={nomeLivro}
        onChangeText={setNomeLivro}
      />
      
      <Text style={styles.label}>Autor</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite o nome do autor"
        value={autorLivro}
        onChangeText={setAutorLivro}
      />

      <Button title="Selecionar Imagem" onPress={selecionarImagem} color="#4682b4" />

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      )}

      <Button
        title={loading ? "Salvando..." : editingBookId ? "Atualizar Livro" : "Adicionar Livro"}
        onPress={adicionarOuAtualizarLivro}
        color="#6b8e23"
      />

      <Text style={styles.sectionTitle}>Currently Reading</Text>
      <FlatList
        data={currentlyReading}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.bookList}
      />

      <Text style={styles.sectionTitle}>Books Read</Text>
      <FlatList
        data={booksRead}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.bookList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b1b1b',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  bookList: {
    marginTop: 10,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bookIcon: {
    marginRight: 15,
  },
  bookImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  bookDetails: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
    backgroundColor: '#4682b4',
    padding: 5,
    borderRadius: 5,
  }
});
