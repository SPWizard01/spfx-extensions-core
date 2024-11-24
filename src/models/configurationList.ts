import type { ConfigurationNames } from '../core/utility/defaultConfig';

export interface ConfigurationListData {
    Title: keyof typeof ConfigurationNames;
    Data: any;
    date: string;
    expires: string;
}