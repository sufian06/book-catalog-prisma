/* eslint-disable no-unused-vars */
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { prisma } from '../../../shared/prisma';

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

export const AuthService = {
  insertIntoDB,
};
