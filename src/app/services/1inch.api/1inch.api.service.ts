import { HttpClient, HttpParams } from '@angular/common/http';
import { delay, mergeMap, retryWhen } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { exchanges, ISymbol2Token, Quote, SupportedExchanges, SwapData } from './1inch.api.dto';

@Injectable({
  providedIn: 'root'
})
export class OneInchApiService {

  private url = 'https://gnosis.api.enterprise.1inch.exchange/v1.1';

  constructor(private http: HttpClient) {
  }

  public getQuote$(
    fromTokenSymbol: string,
    toTokenSymbol: string,
    amount: string,
    disabledExchangesList: SupportedExchanges[] = []
  ): Observable<Quote> {

    const disableExList = disabledExchangesList.map((i) => exchanges[i]).join(',');

    let params = new HttpParams();
    params = params.append('fromTokenSymbol', fromTokenSymbol);
    params = params.append('toTokenSymbol', toTokenSymbol);
    params = params.append('amount', amount);
    if (disabledExchangesList.length !== 0) {
      params = params.append('disabledExchangesList', disableExList);
    }

    const url = this.url + '/quote';

    return this.http.get<Quote>(url, { params }).pipe(
      delayedRetry(1000)
    );
  }

  public getSwapData$(
    fromTokenSymbol: string,
    toTokenSymbol: string,
    amount: string,
    fromWalletAddress: string,
    slippage = '1',
    disableEstimate = false,
    disabledExchangesList: SupportedExchanges[] = []
  ): Observable<SwapData> {

    const disableExList = disabledExchangesList.map((i) => exchanges[i]).join(',');

    let params = new HttpParams();
    params = params.append('fromTokenSymbol', fromTokenSymbol);
    params = params.append('toTokenSymbol', toTokenSymbol);
    params = params.append('amount', amount);
    params = params.append('fromAddress', fromWalletAddress);
    params = params.append('slippage', slippage);
    params = params.append('disableEstimate', String(disableEstimate));
    params = params.append('disabledExchangesList', disableExList);

    const url = this.url + '/swap';

    return this.http.get<SwapData>(url, { params }).pipe(
      delayedRetry(1000)
    );
  }

  public getTokens$(): Observable<ISymbol2Token> {

    const url = this.url + '/tokens';

    return this.http.get<ISymbol2Token[]>(url).pipe(
      delayedRetry(1000)
    );
  }
}

const DEFAULT_MAX_RETRIES = 1;

function delayedRetry(delayMs: number, maxRetry = DEFAULT_MAX_RETRIES) {
  let retries = maxRetry;

  return (src: Observable<any>) =>
    src.pipe(
      retryWhen((errors: Observable<any>) => errors.pipe(
        delay(delayMs),
        mergeMap(error => retries-- > 0 ? of(error) : throwError(error))
      ))
    );
}
