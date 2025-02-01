// 'server.host',
// 'server.port',
// 'database.username',
// 'database.password',
// 'logging.level'


export interface IConfigOption {
  key: string;
  description: string;
  type: 'string' | 'number' | 'boolean';
  multiple?: boolean;
  default?: string | number | boolean;
}

export const options: IConfigOption[] = [
  {
    key: 'server.host',
    description: 'The hostname or IP address that the server should listen on',
    type: 'string',
    default: 'localhost'
  },
  {
    key: 'server.port',
    description: 'The port that the server should listen on',
    type: 'number',
    multiple: true,
    default: 3000
  },
  {
    key: 'database.username',
    description: 'The username to use when connecting to the database',
    type: 'string',
  },
  {
    key: 'database.password',
    description: 'The password to use when connecting to the database',
    type: 'string',
  },
  {
    key: 'logging.level',
    description: 'The level of logging to use',
    type: 'string',
    default: 'info'
  }
];