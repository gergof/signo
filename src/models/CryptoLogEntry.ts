import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn
} from 'typeorm';

import Engine from './Engine.js';
import Signee from './Signee.js';
import User from './User.js';

@Entity('crypto_log')
class CryptoLogEntry {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	timestamp!: Date;

	@ManyToOne(() => User, { onDelete: 'NO ACTION', nullable: true })
	@JoinColumn()
	user!: User | null;

	@ManyToOne(() => Signee, { onDelete: 'NO ACTION', nullable: true })
	@JoinColumn()
	signee!: Signee | null;

	@ManyToOne(() => Engine, { onDelete: 'NO ACTION', nullable: true })
	@JoinColumn()
	engine!: Engine | null;

	@Column('varchar', { length: 255, nullable: true })
	token!: string | null;

	@Column('varchar', { length: 60 })
	action!: string;

	@Column('text')
	message!: string;

	@Column('varchar', { length: 64 })
	hash!: string;
}

export default CryptoLogEntry;
