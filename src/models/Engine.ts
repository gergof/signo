import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('engines')
class Engine {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column('varchar', { length: 60 })
	type!: string;

	@Column('varchar', { length: 60 })
	name!: string;

	@Column('tinyint')
	active!: boolean;

	@Column('varchar', { length: 60 })
	tokenModule!: string;

	@Column('varchar', { length: 60 })
	tokenSn!: string;

	@Column('varchar', { length: 60 })
	tokenSlot!: string;
}

export default Engine;
