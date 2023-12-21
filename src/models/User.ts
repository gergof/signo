import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column('varchar', { length: 60 })
	username!: string;

	@Column('varchar', { length: 60 })
	name!: string;

	@Column('tinyint')
	active!: boolean;

	@Column('varchar', { length: 100 })
	password!: string;
}

export default User;
