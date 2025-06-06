const db = require("../models/index"),
Post = db.post,
Op = db.Sequelize.Op;

const { Sequelize, sequelize } = require('../models');

exports.searchResult = async (req, res) => {
    try {
        const userId = req.user?.userId || 16; // 사용자 id 받아오기
        const material = req.query.material; // 검색어 읽기
        const sort = req.query.sort; // 정렬 방법 읽기

        let order = [['date', 'DESC']]; // 최신순

        let filteredPosts = []; // 검색 결과 게시물을 담을 배열
        // 검색어와 일치하는 포스트 찾기
        if (material && material.trim() !== "") {
            filteredPosts = await Post.findAll({
                where: {
                    [Op.or]: [
                        {
                            title: {
                                [Op.like]: `%${material}%`
                            }
                        },
                        {
                            '$ingredients.ingredientName$': {
                                [Op.like]: `%${material}%`
                            }
                        }
                    ]
                },
                include: [{
                    model: db.ingredient,
                    through: { attributes: [] }
                }],
            });
        }

        // 페이징 변수들
        const postNum = filteredPosts.length; // 검색 결과 포스트 개수
        const pageSize = 5; // 한 페이지 당 보여줄 포스트 개수
        const pageNum = Math.ceil(postNum / pageSize); // 페이지 개수
        const currentPage = req.query.page ? parseInt(req.query.page) : 1; // page 존재하지 않으면 1로 설정
        const offset = (currentPage - 1) * pageSize; //페이지 오프셋

        // 필터링된 포스트의 모든 재료 가져오기
        const postIds = filteredPosts.map(post => post.postId); // 'id' 대신 'postId' 사용

        const posts = await Post.findAll({
            where: { postId: postIds }, // 'id' 대신 'postId' 사용
            include: [
                {
                    model: db.ingredient,
                    through: { attributes: [] }
                },
                {
                    model: db.comment,
                    attributes: []
                },
                {
                    model: db.image,
                    as: 'images'
                }
            ],
            group: ['post.postId'],
            order: order,
            limit: pageSize,
            offset: offset
        });

        // 재료 나열
        let ingredientMap = {};
        if (postIds.length > 0) {
            const query = `
                SELECT p.postId,
                       GROUP_CONCAT(DISTINCT i.ingredientName ORDER BY i.ingredientName SEPARATOR ', ') AS ingredients
                FROM posts p
                LEFT JOIN usages pi ON p.postId = pi.postId
                LEFT JOIN ingredients i ON pi.ingredientId = i.ingredientId
                WHERE p.postId IN (:postIds)
                GROUP BY p.postId;
            `;
            const ingredientResults = await sequelize.query(query, {
                replacements: { postIds },
                type: Sequelize.QueryTypes.SELECT
            });

            ingredientMap = ingredientResults.reduce((map, item) => {
                map[item.postId] = item.ingredients;
                return map;
            }, {});
        }

        const postsWithIngredients = posts.map(post => ({
            ...post.get({ plain: true }),
            ingredients: ingredientMap[post.postId] || ''
        }));

        // 사용자가 클릭한 게시글 및 저장한 게시글 ID 조회
        const savedPosts = await db.save.findAll({
            where: { userId },
            attributes: ['postId']
        });
        const savedPostIds = savedPosts.map(save => save.postId);

        // 검색 결과 페이지 렌더링
        res.render('recipe/searchResult', {
            showCategoryBar: true,
            filteredPosts: filteredPosts,
            result_posts: postsWithIngredients,
            searchQuery: material,
            sort: sort,
            savedPostIds,
            user: { userId },
            pageNum: pageNum, // 전체 페이지 개수
            currentPage: currentPage //현재 페이지
        });
    } catch (err) {
        console.error("Error rendering search page:", err);
        res.status(500).send({
            message: "Error rendering search page"
        });
    }
};