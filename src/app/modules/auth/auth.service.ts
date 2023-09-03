/* eslint-disable no-unused-vars */
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { prisma } from '../../../shared/prisma';
import { ILoginUser, ILoginUserResponse } from './auth.interface';

const insertIntoDB = async (data: User) => {
  const isExist = await prisma.user.findFirst({
    where: {
      email: data.email,
    },
  });

  if (isExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The email is already exist');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Something went wrong!');
  }

  const { password, ...withoutPasswoord } = result;

  return withoutPasswoord;
};

const userLogin = async (data: ILoginUser): Promise<ILoginUserResponse> => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password does not matched');
  }
  // access token
  const accessToken = jwtHelpers.createToken(
    { email: user.email, role: user.role, id: user.id },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string
  );

  // refresh token
  const refreshToken = jwtHelpers.createToken(
    { email: user.email, role: user.role, id: user.id },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthService = {
  insertIntoDB,
  userLogin,
};
