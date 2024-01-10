import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	PrimaryGeneratedColumn
} from 'typeorm';

import Engine from './Engine.js';

@Entity('signees')
class Signee {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column('varchar', { length: 60 })
	name!: string;

	@Column('tinyint')
	active!: boolean;

	@Column('varchar', { length: 60 })
	hmacSecret!: string;

	@ManyToMany(() => Engine, { eager: true })
	@JoinTable()
	engines!: Engine[];
}

export default Signee;
