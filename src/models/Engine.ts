import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { SigningEngineType } from '../engines/index.js';

@Entity('engines')
class Engine {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column('varchar', { length: 60 })
	type!: SigningEngineType;

	@Column('varchar', { length: 60 })
	name!: string;

	@Column('tinyint')
	active!: boolean;

	@Column('varchar', { length: 120 })
	tokenId!: string;

	@Column('varchar', { length: 60 })
	tokenSlot!: string;

	@Column('varchar', { length: 60 })
	mechanism!: string;
}

export default Engine;
