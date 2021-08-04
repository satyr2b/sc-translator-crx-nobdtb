import React, { useEffect, useRef, useState } from 'react';
import IconFont from '../../../components/IconFont';
import { getMessage } from '../../../public/i18n';
import { TextPreprocessingRegExp } from '../../../types';
import './style.css';

type RegExpListProps = {
    textPreprocessingRegExpList: TextPreprocessingRegExp[];
    onSave: (textPreprocessingRegExpList: TextPreprocessingRegExp[]) => void;
};

const RegExpList: React.FC<RegExpListProps> = ({ textPreprocessingRegExpList, onSave }) => {
    const [regExpList, setRegExpList] = useState<TextPreprocessingRegExp[]>([]);
    const [updated, setUpdated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [modifyMode, setModifyMode] = useState(false);

    const patternEleRef = useRef<HTMLInputElement>(null);
    const flagsEleRef = useRef<HTMLInputElement>(null);
    const replacementEleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setRegExpList(textPreprocessingRegExpList);
    }, [textPreprocessingRegExpList]);

    // only for unique key of "regExpList.map"
    const timestamp = new Date().getTime();

    return (
        <div className='regexp-list'>
            <div className='regexp-list-grid'>
                <span>{getMessage('optionsPattern')}</span>
                <span>{getMessage('optionsFlags')}</span>
                <span>{getMessage('optionsReplacement')}</span>
            </div>
            {regExpList.map((v, i) => (<div className='regexp-list__grid' key={i + timestamp}>
                <input type='text' disabled defaultValue={v.pattern} />
                <input type='text' disabled defaultValue={v.flags} />
                <input type='text' disabled defaultValue={v.replacement} />
                {modifyMode && <IconFont
                    iconName='#icon-MdDelete'
                    className='button'
                    onClick={() => {
                        setRegExpList(regExpList.filter(v1 => v1 !== v));
                        setUpdated(true);
                    }}
                />}
            </div>))}
            {modifyMode && <div className='regexp-list__grid'>
                <input type='text' ref={patternEleRef} placeholder={getMessage('optionsPatternCanNotBeEmpty')}/>
                <input type='text' ref={flagsEleRef} />
                <input type='text' ref={replacementEleRef} />
                <IconFont
                    iconName='#icon-MdAdd'
                    className='button'
                    onClick={() => {
                        if (!patternEleRef.current || !flagsEleRef.current || !replacementEleRef.current) { return; }

                        if (!patternEleRef.current.value) {
                            setErrorMessage(getMessage('optionsPatternCanNotBeEmpty'))
                            return;
                        }

                        const pattern = patternEleRef.current.value;
                        const flags = Object.keys(Array.from(flagsEleRef.current.value.replace(/[^gimsuy]/g, '')).reduce((t, c) => ({ ...t, [c]: c }), {})).join('');
                        const replacement = replacementEleRef.current.value;

                        try {
                            // Test this statement without error.
                            'test text'.replace(new RegExp(pattern, flags), replacement);

                            patternEleRef.current.value && setRegExpList((v) => ([...v, {
                                pattern,
                                flags,
                                replacement
                            }]));

                            patternEleRef.current.value = '';
                            flagsEleRef.current.value = '';
                            replacementEleRef.current.value = '';

                            setUpdated(true);
                            setErrorMessage('');
                        }
                        catch (err) {
                            setErrorMessage(`Error: ${err.message}`);
                        }
                    }}
                />
            </div>}
            {errorMessage && <div>{errorMessage}</div>}
            <div>
                {modifyMode ? <>
                    <button disabled={!updated} onClick={() => {
                        onSave(regExpList);
                        setUpdated(false);
                        setErrorMessage('');
                        setModifyMode(false);
                    }}>{getMessage('wordSave')}</button>
                    <button onClick={() => {
                        setUpdated(false);
                        setRegExpList(textPreprocessingRegExpList);
                        setErrorMessage('');
                        setModifyMode(false);
                    }}>{getMessage('wordCancel')}</button>
                </> : <button onClick={() => setModifyMode(true)}>{getMessage('optionsModify')}</button>}
            </div>
        </div>
    );
};

export default RegExpList;