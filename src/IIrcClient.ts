import * as irc from './libs/irc';
import { IsStatResponse } from './parsers/StatParser';
import { EventEmitter } from 'events';
import { getLogger } from './Loggers';

const ircLogger = getLogger('irc');
const pmLogger = getLogger('PMLogger');

// テスト用に使用する部分をインターフェースとして定義する
// typescriptのインターフェースはダックタイピング可能なので、
// このインターフェースで宣言しておけばダミーと本物どちらも取り扱える（はず
export interface IIrcClient extends EventEmitter {
  hostMask: string;
  nick: string;
  conn: any;
  join(channel: string, callback?: irc.handlers.IJoinChannel | undefined): void;
  part(channel: string, message: string, callback: irc.handlers.IPartChannel): void;
  say(target: string, message: string): void;
  connect(retryCount?: number | irc.handlers.IRaw | undefined, callback?: irc.handlers.IRaw | undefined): void;
  disconnect(message: string, callback: () => void): void;
}

export function logIrcEvent(client: IIrcClient) {
  client.on('error', function (message) {
    ircLogger.error(`ERROR:\n${JSON.stringify(message)}\n${JSON.stringify(message.stack)}\n${message}\n${message.stack}`);
  });
  client.on('registered', function (message) {
    const args = message.args as string[] | undefined;
    ircLogger.debug('@reg %s', args?.join(', '));
  });
  client.on('message', function (from, to, message) {
    ircLogger.debug('@msg  %s => %s: %s', from, to, message);
  });
  client.on('pm', function (nick, message) {
    ircLogger.debug('@pm   %s: %s', nick, message);
  });
  client.on('join', function (channel, who) {
    ircLogger.debug('@join %s has joined %s', who, channel);
  });
  client.on('part', function (channel, who, reason) {
    ircLogger.debug('@part %s has left %s: %s', who, channel, reason);
  });
  client.on('kick', function (channel, who, by, reason) {
    ircLogger.debug('@kick %s was kicked from %s by %s: %s', who, channel, by, reason);
  });
  client.on('invite', (channel, from) => {
    ircLogger.debug(`@invt ${from} invite you to ${channel}`);
  });
  client.on('notice', function (from, to, message) {
    ircLogger.debug('@notice  %s => %s: %s', from, to, message);
  });
  client.on('action', function (from, to, text, message) {
    ircLogger.debug('@action  %s => %s: %s', from, to, text);
  });
  client.on('selfMessage', (target: string, toSend) => {
    ircLogger.debug('@sent bot => %s: %s', target, toSend);
  });
}

export function logPrivateMessage(client: IIrcClient) {
  client.on('message', (from, to, message) => {
    if (to === client.nick) {
      if (IsStatResponse(message)) {
        pmLogger.trace(`pm ${from} -> ${message}`);
      } else {
        pmLogger.info(`pm ${from} -> ${message}`);
      }
    }
  });
}
