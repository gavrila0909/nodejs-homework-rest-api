const request = require('supertest');
const app = require('../app'); 
const User = require('../models/userSchema'); 
const jwt = require('jsonwebtoken');

jest.mock('../models/userSchema');

describe('POST /login', () => {
  it('should return status 200 and a token along with user details', async () => {

    const mockUser = {
      email: 'testuser@example.com',
      subscription: 'starter',
      avatarURL: 'http://avatar.url',
      generateAuthToken: jest.fn().mockReturnValue('mockedToken'),
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true), 
    };
    
    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const loginPayload = {
      email: 'testuser@example.com',
      password: 'password123'
    };

  
    const response = await request(app)
      .post('/login')
      .send(loginPayload);

  
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('email', 'testuser@example.com');
    expect(response.body.user).toHaveProperty('subscription', 'starter');
  });
});
