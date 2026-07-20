import { isNull, isUndefined } from 'lodash';
import Cookies from 'js-cookie';
import axios from 'axios';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
export const apiUrl = isDev ? devApi : prodApi;

export const isNullOrUndefinedOrBlank = (value: any) => {
  return isNull(value) || isUndefined(value) || value === '';
};

export const PostData = async (endPoint: string, parameters: any) => {
  const res = await axios.post(apiUrl + endPoint, parameters, {
    headers: {
      Authorization: ('Bearer ' + Cookies.get('WebCimsTokenId')) as string,
    },
  });

  if (res) {
    return res.data;
  } else {
    return {
      status: 0,
      message: 'Error while posting the data!',
    };
  }
};

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const WithAccess = async (parameters: any) => {
  const res = await axios.post(apiUrl + 'GetRecords', parameters, {
    headers: {
      Authorization: ('Bearer ' + Cookies.get('WebCimsTokenId')) as string,
    },
  });

  if (res) {
    if (res.data.parameters.lst.length > 0) {
      return {
        status: 1,
      };
    } else {
      return {
        status: 0,
      };
    }
  }
};

export const formatNumberWithCommas = (x: number) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
