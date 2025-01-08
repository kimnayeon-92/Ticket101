import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { signUp, confirmSignUp, signIn, signOut } from 'aws-amplify/auth';
import { useAuth } from '../context/AuthContext';
import { fetchUserAttributes } from '@aws-amplify/auth';

const Signin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        verificationCode: ''
    });
    const [error, setError] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const signUpResponse = await signUp({
                username: formData.email,
                password: formData.password,
                options: {
                    userAttributes: {
                        email: formData.email
                    }
                }
            });

            console.log('회원가입 성공:', signUpResponse);

            const response = await fetch('http://localhost:5002/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    cognitoId: signUpResponse.userId
                }),
            });

            if (!response.ok) {
                throw new Error('회원가입 실패');
            }

            setShowVerification(true);
        } catch (error) {
            console.error('회원가입 에러:', error);
            setError(error.message);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        try {
            // 기존 세션 정리
            try {
                await signOut({ global: true });
                console.log('기존 세션 정리 완료');
            } catch (signOutError) {
                console.log('세션 정리 중 에러 (무시 가능):', signOutError);
            }

            // 이메일 인증
            await confirmSignUp({
                username: formData.email,
                confirmationCode: formData.verificationCode
            });
            console.log('이메일 인증 성공');

            // 로그인
            const signInResponse = await signIn({
                username: formData.email,
                password: formData.password
            });
            console.log('로그인 성공:', signInResponse);

            const userAttributes = await fetchUserAttributes();
            console.log('userAttributes:', userAttributes);

        // 객체에서 직접 속성 접근
            const userId = userAttributes?.sub;

            // 사용자 정보 저장
            const userInfo = {
                email: formData.email,
                sub: userId
            };
            console.log('로그인 성공:', userInfo);

            // AuthContext 업데이트
            setUser(userInfo);
            
            // localStorage에 사용자 정보 저장
            localStorage.setItem('userInfo', JSON.stringify(userInfo));


            
            // 선호도 페이지로 이동
            setTimeout(() => {
                navigate('/preferences/basic');
            }, 100); // 상태가 업데이트된 후 이동
        } catch (error) {
            console.error('인증/로그인 에러:', error);
            setError(error.message);
        }
    };

    return (
        <section id="signin">
            <div className="signin__inner">
                <h2>회원가입</h2>
                {error && <p className="error-message">{error}</p>}
                
                {showVerification ? (
                    <form onSubmit={handleVerification}>
                        <fieldset>
                            <legend className="blind">인증 코드 확인</legend>
                            <div className="form-group">
                                <label htmlFor="verificationCode">인증 코드</label>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    name="verificationCode"
                                    value={formData.verificationCode}
                                    onChange={handleChange}
                                    placeholder="이메일로 받은 인증 코드를 입력하세요"
                                    required
                                />
                            </div>
                            <button type="submit">인증하기</button>
                        </fieldset>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <fieldset>
                            <legend className="blind">회원가입 폼</legend>
                            <div className="form-group">
                                <label htmlFor="youEmail">이메일</label>
                                <input 
                                    type="email"
                                    id="youEmail"
                                    name="email"
                                    placeholder="이메일을 입력해주세요."
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="youPass">비밀번호</label>
                                <input 
                                    type="password"
                                    id="youPass"
                                    name="password"
                                    placeholder="비밀번호를 입력해주세요."
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="youPassC">비밀번호 확인</label>
                                <input 
                                    type="password"
                                    id="youPassC"
                                    name="confirmPassword"
                                    placeholder="비밀번호를 다시 입력해주세요."
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button type="submit">회원가입</button>
                        </fieldset>
                    </form>
                )}

                <div className="signin__footer">
                    <p>이미 계정이 있으신가요? <a href="/login">로그인</a></p>
                </div>
            </div>
        </section>
    );
};

export default Signin;
