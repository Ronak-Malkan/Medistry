const { AppDataSource } = require('../dist/data-source');

async function checkDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    // Check accounts
    const accountCount = await AppDataSource.getRepository('Account').count();
    console.log('Total accounts:', accountCount);

    if (accountCount > 0) {
      const accounts = await AppDataSource.getRepository('Account').find();
      console.log(
        'Accounts:',
        accounts.map((a) => ({ id: a.accountId, name: a.name })),
      );
    }

    // Check users
    const userCount = await AppDataSource.getRepository('User').count();
    console.log('Total users:', userCount);

    if (userCount > 0) {
      const users = await AppDataSource.getRepository('User').find();
      console.log(
        'Users:',
        users.map((u) => ({
          id: u.userId,
          username: u.username,
          role: u.role,
        })),
      );
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();
