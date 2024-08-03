# API Documentation

## 1. Create a New User

- **Route**: `POST /users`
- **Description**: Creates a new user with a username, password, and an array of album IDs.
- **Request Body**:
  ```json
  {
      "username": "testuser",
      "password": "password123",
      "albums": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
  ```

## 2. Get All Users

- **Route**: `GET /users`
- **Description**: Retrieves a list of all users in the database.
- **Response**: The username, password and albums associated. 
```json
{
    "username": "updateduser",
    "password": "newpassword123",
    "albums": [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
}
```
 ## 3. Add a Single Album

-  **Route**: `POST /users/:id/albums`
-  **Description**: Adds a single album ID to the first available album field for a specific user identified by their ID. Also adds this album to the album table with the following fields
- **Request**:
```json
{
    "album": 1,
    "name": "The Dark Side of the Moon",
    "band": "Pink Floyd",
    "genre": "Progressive Rock",
    "releaseDate": "1973-03-01",
    "coverURL": "https://example.com/cover.jpg",
    "linkURL": "https://example.com/album"
}

```

## 4. Remove an Album by Value (DELETE /users/:id/albums/:album):

- **Route**: `DELETE /users/:id/albums/:album`
- **Description**: This endpoint removes an album by searching for the specified album ID value across all album fields (album1 to album10) for a user identified by their ID. If the album ID is found, the corresponding field is set to NULL.
- **Parameters**:
        id: The ID of the user.
        album: The album ID value to remove.

## 5. Remove a user by finding username. 
    
- **Route**: `DELETE /users`
- **Description**: To remove a user, send a DELETE request to the /users endpoint with a JSON body containing the username of the user you wish to remove.
- **Request Body**
```json
{
    "username": "username"
}
``` 
## Summary of Routes

| HTTP Method | Route                     | Description                                      |
|-------------|---------------------------|--------------------------------------------------|
| POST        | `/users`                  | Create a new user.                               |
| GET         | `/users`                  | Get all users.                                   |
| PUT         | `/users/:id`              | Update a specific user.                          |
| POST        | `/users/:id/albums`       | Add a single album to the next available field.  |
| PUT         | `/users/:id/albums/:album`| Modify a given album for a specific user.        |
| DELETE      | `/users/:id/albums/:album`| Delete a given album for a specific user.        |
| DELETE      | `/users`                  | Delete a user by username.                       |
| GET         | `/albums`                 | Get all albums.                                  |
| GET         | `/albums:album`           | Get all albums.                                  |
| GET         | `/votes:username`         | Get all albums for a given user                  |


**Misc.**

Intended for use in app : 

`POST /users`
`POST /users/:id/albums`
`DELETE /users/:id/albums`
`GET /votes:username` 
`GET /albums/:album`

**Extra notes** : 

Adding a album to a user adds the albumid to the first available album slot (empty), 
also checks if it does not exist for the user. Then it attempts to add the album to the album
table, if it does not exist it adds it and sets votes to 1, if it does already exist increases
the vote count. If no available slot are found it does nothing. `POST /users/:id/albums` 

Removing a album attempts to remove the given album from the user table (set the albumN = NULL)
if the album exists it also removes 1 vote from the albums table if the votes count reaches 0 
the full record will be deleted from albums aswell. If it does not find the album in the
user list of albums it does nothing. `DELETE /users/:id/albums` 

