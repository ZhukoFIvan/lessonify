import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

async function main() {
  const email = 'admin@repka.app'
  const password = 'Admin123!'

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      name: 'Администратор',
      role: 'ADMIN',
    },
  })

  console.log('✓ Admin user ready:')
  console.log('  Email:', admin.email)
  console.log('  Password:', password)
  console.log('  ID:', admin.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
